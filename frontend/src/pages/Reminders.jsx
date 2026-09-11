import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Check,
  Plus,
  ShieldCheck,
  Volume2,
  X,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import {
  REMINDERS_KEY,
  readJson,
  writeJson,
} from '../lib/storage'
import { api } from '../lib/api'

const seed = [
  {
    id: 'r1',
    title: 'Morning medication',
    time: '09:00',
    kind: 'Health routine',
    done: false,
  },
  {
    id: 'r2',
    title: 'Evening walk',
    time: '17:30',
    kind: 'Daily activity',
    done: false,
  },
]

export default function Reminders() {
  const [items, setItems] = useState(() =>
    readJson(REMINDERS_KEY, seed),
  )

  const [form, setForm] = useState({
    title: '',
    time: '09:00',
    kind: 'Daily',
  })

  const [notificationPermission, setNotificationPermission] =
    useState(() =>
      typeof Notification !== 'undefined'
        ? Notification.permission
        : 'unsupported',
    )

  const [popup, setPopup] = useState(null)
  const [currentTime, setCurrentTime] = useState(
    getCurrentTime(),
  )

  const notificationEnabled =
    notificationPermission === 'granted'

  const notificationLabel =
    notificationPermission === 'granted'
      ? 'Notifications are enabled.'
      : notificationPermission === 'denied'
        ? 'Desktop notifications are blocked. In-app reminders still work.'
        : 'Notifications are not enabled yet.'

  useEffect(() => {
    writeJson(REMINDERS_KEY, items)
  }, [items])

  useEffect(() => {
    let active = true

    api('/reminders')
      .then((data) => {
        if (active && Array.isArray(data) && data.length) {
          setItems(data)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(getCurrentTime())
    }, 15000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!items.length) return

    const now = new Date()
    const today = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}-${String(now.getDate()).padStart(
      2,
      '0',
    )}`

    items.forEach((item) => {
      if (item.done || !item.time) return
      if (!isReminderDue(item.time, now)) return

      const key = `memorycare-reminder-fired-${today}-${item.id}`

      if (localStorage.getItem(key)) return

      localStorage.setItem(key, '1')

      openPopup(
        item.title,
        `${formatTime(item.time)} · ${item.kind}`,
      )

      sendDesktopNotification(item)
    })
  }, [items, currentTime])

  useEffect(() => {
    if (!popup) return undefined

    const timer = window.setTimeout(() => {
      setPopup(null)
    }, 10000)

    return () => window.clearTimeout(timer)
  }, [popup])

  async function enableNotifications() {
    if (typeof Notification === 'undefined') {
      setNotificationPermission('unsupported')

      openPopup(
        'Notifications unavailable',
        'Desktop notifications are not supported here, but in-app reminders are available.',
      )

      return
    }

    try {
      const permission =
        await Notification.requestPermission()

      setNotificationPermission(permission)

      if (permission === 'granted') {
        openPopup(
          'Notifications enabled',
          'MemoryCare NE can now show desktop reminder notifications when supported by the browser.',
        )

        try {
          new Notification('MemoryCare NE', {
            body: 'Reminder notifications are now enabled.',
            tag: 'memorycare-enabled',
          })
        } catch {}
      } else if (permission === 'denied') {
        openPopup(
          'In-app reminders remain active',
          'Opera GX has blocked desktop notifications. MemoryCare NE will still show reminders inside the application.',
        )
      } else {
        openPopup(
          'Permission not granted',
          'You can continue using the in-app reminder popup.',
        )
      }
    } catch {
      openPopup(
        'Notification permission unavailable',
        'You can continue using the in-app reminder popup.',
      )
    }
  }

  function testNotification() {
    openPopup(
      'This is a test reminder',
      'The in-app reminder system is working. Desktop notification support is optional.',
    )

    playAlertSound()

    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification('MemoryCare NE', {
          body: 'This is a test reminder.',
          tag: 'memorycare-test',
        })
      } catch {}
    }
  }

  async function add() {
    const title = form.title.trim()

    if (!title) {
      openPopup(
        'Reminder title required',
        'Please enter a short reminder before adding it.',
      )

      return
    }

    let id =
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Date.now().toString()

    try {
      const saved = await api('/reminders', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      if (saved?.id !== undefined) {
        id = saved.id
      }
    } catch {}

    const newItem = {
      ...form,
      title,
      id,
      done: false,
    }

    setItems((current) =>
      [...current, newItem].sort(
        (a, b) =>
          String(a.time).localeCompare(
            String(b.time),
          ),
      ),
    )

    setForm({
      title: '',
      time: form.time,
      kind: form.kind,
    })

    openPopup(
      'Reminder added',
      `${title} is scheduled for ${formatTime(form.time)}.`,
    )
  }

  async function toggle(id) {
    const target = items.find(
      (item) => String(item.id) === String(id),
    )

    if (!target) return

    const nextDone = !target.done

    setItems((current) =>
      current.map((item) =>
        String(item.id) === String(id)
          ? { ...item, done: nextDone }
          : item,
      ),
    )

    if (!String(id).startsWith('r')) {
      api(`/reminders/${id}`, {
        method: 'PATCH',
      }).catch(() => {})
    }

    openPopup(
      nextDone
        ? 'Reminder completed'
        : 'Reminder marked active',
      target.title,
    )
  }

  const todaysItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        String(a.time).localeCompare(
          String(b.time),
        ),
      ),
    [items],
  )

  return (
    <div className="relative mx-auto max-w-6xl">
      {popup ? (
        <ReminderPopup
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup(null)}
        />
      ) : null}

      <PageHeader
        title="Reminders"
        subtitle="Keep important daily routines visible and receive a notification when a reminder is due."
      />

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              <Bell
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Reminder notifications
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                MemoryCare NE will show an in-app reminder popup
                even if Opera GX blocks desktop notifications.
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck
                  className={`h-5 w-5 ${
                    notificationEnabled
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                  aria-hidden="true"
                />

                <span
                  className={
                    notificationEnabled
                      ? 'text-teal-700 dark:text-teal-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }
                >
                  {notificationLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <button
              type="button"
              onClick={enableNotifications}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-base font-bold text-white shadow-sm hover:bg-teal-800"
            >
              <Bell
                className="h-5 w-5"
                aria-hidden="true"
              />

              {notificationEnabled
                ? 'Notifications enabled'
                : 'Enable notifications'}
            </button>

            <button
              type="button"
              onClick={testNotification}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Volume2
                className="h-5 w-5"
                aria-hidden="true"
              />

              Test notification
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Add a reminder
        </h2>

        <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
          Choose a time and add a short description.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]">
          <div>
            <label
              htmlFor="reminder-title"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Reminder
            </label>

            <input
              id="reminder-title"
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
              placeholder="What should I remember?"
              className="min-h-12 w-full rounded-xl border px-4 text-lg"
            />
          </div>

          <div>
            <label
              htmlFor="reminder-time"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Time
            </label>

            <input
              id="reminder-time"
              type="time"
              value={form.time}
              onChange={(event) =>
                setForm({
                  ...form,
                  time: event.target.value,
                })
              }
              className="min-h-12 w-full rounded-xl border px-4 text-lg"
            />
          </div>

          <div>
            <label
              htmlFor="reminder-kind"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Type
            </label>

            <select
              id="reminder-kind"
              value={form.kind}
              onChange={(event) =>
                setForm({
                  ...form,
                  kind: event.target.value,
                })
              }
              className="min-h-12 w-full rounded-xl border px-4 text-lg"
            >
              <option value="Daily">Daily</option>
              <option value="Health routine">
                Health routine
              </option>
              <option value="Daily activity">
                Daily activity
              </option>
              <option value="Appointment">
                Appointment
              </option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={add}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-lg font-bold text-white shadow-sm hover:bg-teal-800 md:w-auto"
            >
              <Plus
                className="h-5 w-5"
                aria-hidden="true"
              />

              Add reminder
            </button>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Today's reminders
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {todaysItems.length
                ? 'Your scheduled routines for today.'
                : 'No reminders scheduled yet.'}
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
            <ClockIcon />
            {formatTime(currentTime)}
          </div>
        </div>

        {todaysItems.length ? (
          <div className="space-y-3">
            {todaysItems.map((item) => (
              <article
                key={item.id}
                className={`flex flex-col gap-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between ${
                  item.done ? 'opacity-60' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                    <Bell
                      className="h-6 w-6"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3
                      className={`break-words text-xl font-bold text-slate-900 dark:text-white ${
                        item.done ? 'line-through' : ''
                      }`}
                    >
                      {item.title}
                    </h3>

                    <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                      {formatTime(item.time)} · {item.kind}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-5 text-base font-bold ${
                    item.done
                      ? 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Check
                    className="h-5 w-5"
                    aria-hidden="true"
                  />

                  {item.done
                    ? 'Completed'
                    : 'Mark completed'}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <Bell
              className="mx-auto h-10 w-10 text-slate-400"
              aria-hidden="true"
            />

            <p className="mt-3 text-lg font-bold text-slate-700 dark:text-slate-200">
              No reminders yet
            </p>

            <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
              Add a reminder above to start building a daily routine.
            </p>
          </div>
        )}
      </section>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-slate-600 dark:border-amber-800 dark:bg-amber-950/40 dark:text-slate-300">
        <strong className="text-slate-800 dark:text-slate-100">
          Reminder note:
        </strong>{' '}
        Reminders are designed to support daily routines. They do
        not replace medical advice or professional care.
      </div>
    </div>
  )

  function openPopup(title, message) {
    setPopup({
      title,
      message,
    })
  }
}

function ReminderPopup({ title, message, onClose }) {
  useEffect(() => {
    playAlertSound()
  }, [])

  return (
    <div
      className="fixed right-4 top-24 z-[100] w-[calc(100%-2rem)] max-w-md"
      role="alert"
      aria-live="assertive"
    >
      <div className="rounded-2xl border border-teal-300 bg-white p-5 shadow-2xl dark:border-teal-700 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
            <Bell
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                  Reminder
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close reminder"
              >
                <X
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </button>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function sendDesktopNotification(item) {
  if (
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted'
  ) {
    return
  }

  try {
    new Notification(`MemoryCare NE: ${item.title}`, {
      body: `${formatTime(item.time)} · ${item.kind}`,
      tag: `memorycare-${item.id}`,
    })
  } catch {}
}

function playAlertSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext

    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(
      880,
      context.currentTime,
    )

    gain.gain.setValueAtTime(
      0.0001,
      context.currentTime,
    )

    gain.gain.exponentialRampToValueAtTime(
      0.18,
      context.currentTime + 0.02,
    )

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.45,
    )

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start()
    oscillator.stop(context.currentTime + 0.5)

    oscillator.addEventListener('ended', () => {
      context.close().catch(() => {})
    })
  } catch {}
}

function isReminderDue(time, now) {
  const [hours, minutes] = String(time)
    .split(':')
    .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return false
  }

  const reminderMinutes =
    hours * 60 + minutes

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes()

  const difference =
    currentMinutes - reminderMinutes

  return difference >= 0 && difference <= 5
}

function getCurrentTime() {
  const now = new Date()

  return [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join(':')
}

function formatTime(value) {
  if (!value) return '—'

  const [hours, minutes] = String(value)
    .split(':')
    .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value
  }

  const suffix = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12

  return `${displayHour}:${String(minutes).padStart(
    2,
    '0',
  )} ${suffix}`
}

function ClockIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}