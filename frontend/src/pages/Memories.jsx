import { useEffect, useMemo, useState } from 'react'
import {
  HeartHandshake,
  MapPin,
  Plus,
  Trash2,
  UserRound,
  UtensilsCrossed,
  CalendarDays,
  CheckCircle2,
  CloudOff,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { MEMORIES_KEY, readJson, writeJson } from '../lib/storage'
import { api } from '../lib/api'

const seed = [
  {
    id: 'seed1',
    category: 'Important Person',
    title: 'Family',
    details: 'People who matter most',
  },
  {
    id: 'seed2',
    category: 'Important Place',
    title: 'Guwahati',
    details: 'A familiar place in Assam',
  },
  {
    id: 'seed3',
    category: 'Favourite Food',
    title: 'Tea',
    details: 'A familiar everyday favourite',
  },
]

const icons = {
  'Important Person': UserRound,
  'Important Place': MapPin,
  'Favourite Food': UtensilsCrossed,
  'Important Event': CalendarDays,
}

const categories = [
  'Important Person',
  'Important Place',
  'Favourite Food',
  'Important Event',
]

export default function Memories() {
  const [items, setItems] = useState(() =>
    readJson(MEMORIES_KEY, seed),
  )

  const [form, setForm] = useState({
    category: 'Important Person',
    title: '',
    details: '',
  })

  const [status, setStatus] = useState('idle')

  useEffect(() => {
    writeJson(MEMORIES_KEY, items)
  }, [items])

  useEffect(() => {
    let active = true

    api('/memories')
      .then((data) => {
        if (active && Array.isArray(data) && data.length) {
          setItems(data)
        }
      })
      .catch(() => {
        if (active) {
          setStatus('offline')
        }
      })

    return () => {
      active = false
    }
  }, [])

  const groupedCount = useMemo(
    () =>
      items.reduce((total, item) => {
        total[item.category] =
          (total[item.category] || 0) + 1
        return total
      }, {}),
    [items],
  )

  async function add() {
    const title = form.title.trim()
    const details = form.details.trim()

    if (!title) {
      setStatus('validation')
      return
    }

    setStatus('saving')

    const localItem = {
      ...form,
      title,
      details,
      id:
        crypto.randomUUID?.() ||
        Date.now().toString(),
    }

    try {
      const saved = await api('/memories', {
        method: 'POST',
        body: JSON.stringify({
          category: form.category,
          title,
          details,
        }),
      })

      localItem.id = saved.id
      setStatus('saved')
    } catch {
      setStatus('local')
    }

    setItems((current) => [localItem, ...current])

    setForm({
      ...form,
      title: '',
      details: '',
    })
  }

  async function remove(id) {
    setItems((current) =>
      current.filter(
        (item) => String(item.id) !== String(id),
      ),
    )

    if (String(id).startsWith('seed')) {
      return
    }

    try {
      await api(`/memories/${id}`, {
        method: 'DELETE',
      })
    } catch {
      setStatus('offline')
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Memories"
        subtitle="Personal memory cues that can make familiar people, places and routines easier to remember."
      />

      <section className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            <HeartHandshake
              className="h-7 w-7"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Add a memory cue
            </h2>

            <p className="mt-1 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Add something meaningful such as a family member,
              familiar place, favourite food or important event.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-base font-semibold text-slate-800 dark:text-slate-100">
              What kind of memory?
            </span>

            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
              className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-base font-semibold text-slate-800 dark:text-slate-100">
              Name or title
            </span>

            <input
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  add()
                }
              }}
              placeholder="For example, Mother"
              className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-base font-semibold text-slate-800 dark:text-slate-100">
              Helpful detail
            </span>

            <input
              value={form.details}
              onChange={(e) =>
                setForm({
                  ...form,
                  details: e.target.value,
                })
              }
              placeholder="For example, lives nearby or favourite tea"
              className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={add}
          className="mt-5 inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-teal-700 px-7 text-lg font-semibold text-white hover:bg-teal-800"
        >
          <Plus
            className="h-6 w-6"
            aria-hidden="true"
          />
          Add memory
        </button>

        {status === 'saved' ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-teal-800 dark:text-teal-300">
            <CheckCircle2
              className="h-5 w-5"
              aria-hidden="true"
            />
            Memory saved successfully.
          </p>
        ) : null}

        {status === 'local' ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <CloudOff
              className="h-5 w-5"
              aria-hidden="true"
            />
            Memory saved locally. The backend could not be reached.
          </p>
        ) : null}

        {status === 'offline' ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <CloudOff
              className="h-5 w-5"
              aria-hidden="true"
            />
            Backend connection is currently unavailable.
          </p>
        ) : null}

        {status === 'validation' ? (
          <p className="mt-4 text-sm font-medium text-amber-700 dark:text-amber-300">
            Please enter a name or title first.
          </p>
        ) : null}

        {status === 'saving' ? (
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            Saving memory…
          </p>
        ) : null}
      </section>

      <section className="mt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Your memory cues
            </h2>

            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              {items.length}{' '}
              {items.length === 1 ? 'memory' : 'memories'} saved.
            </p>
          </div>

          {items.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(groupedCount).map(
                ([category, count]) => (
                  <span
                    key={category}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {count} · {category}
                  </span>
                ),
              )}
            </div>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <HeartHandshake
              className="mx-auto h-10 w-10 text-teal-700 dark:text-teal-400"
              aria-hidden="true"
            />

            <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
              No memory cues yet
            </h3>

            <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
              Add a familiar person, place, food or event above.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const Icon =
                icons[item.category] || HeartHandshake

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                        <Icon
                          className="h-6 w-6"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {item.category}
                        </p>

                        <h3 className="mt-1 break-words text-xl font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>

                        {item.details ? (
                          <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                            {item.details}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Delete ${item.title}`}
                      title="Delete memory"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                      <Trash2
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            <MapPin
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Familiar places and experiences
            </h2>

            <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              MemoryCare NE can use familiar regional places, foods,
              family experiences and everyday routines as optional
              memory cues.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'Guwahati',
                'Shillong',
                'Imphal',
                'Aizawl',
                'Kohima',
                'Agartala',
                'Itanagar',
                'Gangtok',
              ].map((place) => (
                <span
                  key={place}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                >
                  {place}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <p className="mt-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Memory cues are personal support tools. They are intended
        to help with familiarity and daily routines, not to diagnose
        or treat a medical condition.
      </p>
    </div>
  )
}