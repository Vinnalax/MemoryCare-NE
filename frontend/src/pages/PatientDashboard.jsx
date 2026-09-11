import {
  Bell,
  HeartHandshake,
  Play,
  Puzzle,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const quickActions = [
  {
    title: 'Play a game',
    description: 'Exercise your memory with a simple activity.',
    to: '/games',
    icon: Puzzle,
  },
  {
    title: 'View memories',
    description: 'See your saved people, places, and memories.',
    to: '/memories',
    icon: HeartHandshake,
  },
  {
    title: 'View reminders',
    description: 'Check what you need to remember today.',
    to: '/reminders',
    icon: Bell,
  },
]

export default function PatientDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Welcome section */}
      <section>
        <p className="text-base font-medium text-teal-700 dark:text-teal-400">
          Welcome back
        </p>

        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Good to see you, Asha
        </h2>

        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          Take a moment for yourself. You can play a memory game,
          check your reminders, or revisit something important.
        </p>
      </section>

      {/* Main action */}
      <section className="rounded-3xl bg-teal-700 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Puzzle className="h-7 w-7" aria-hidden="true" />
            </div>

            <h3 className="mt-5 text-2xl font-semibold sm:text-3xl">
              Ready for a memory game?
            </h3>

            <p className="mt-2 text-base leading-relaxed text-teal-50 sm:text-lg">
              A short activity can be a good way to keep your mind
              active and engaged.
            </p>
          </div>

          <Link
            to="/games"
            className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-lg font-semibold text-teal-800 shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-4 focus-visible:outline-white/40"
          >
            <Play className="h-6 w-6" aria-hidden="true" />
            Start a game
          </Link>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4">
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
            What would you like to do?
          </h3>

          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Choose one of the options below.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map(
            ({ title, description, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-4 dark:bg-slate-800 dark:ring-slate-700"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                  <Icon
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </div>

                <h4 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                  {title}
                </h4>

                <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  {description}
                </p>

                <span className="mt-5 inline-flex items-center text-base font-semibold text-teal-700 dark:text-teal-400">
                  Open
                  <span
                    className="ml-2 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </span>
              </Link>
            ),
          )}
        </div>
      </section>

      {/* Simple progress */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              <TrendingUp
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Your progress
              </h3>

              <p className="mt-1 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Keep practicing regularly and watch your activity over time.
              </p>
            </div>
          </div>

          <Link
            to="/progress"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            View progress
          </Link>
        </div>
      </section>
    </div>
  )
}