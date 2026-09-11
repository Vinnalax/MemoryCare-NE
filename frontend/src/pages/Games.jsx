import {
  Brain,
  ChevronRight,
  Layers3,
  ListOrdered,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const games = [
  {
    to: '/games/memory-match',
    icon: Layers3,
    title: 'Memory Match',
    description:
      'Find matching pairs of familiar objects at your own pace.',
    meta: '6–8 pairs · About 3–5 min',
  },
  {
    to: '/games/sequence',
    icon: ListOrdered,
    title: 'Sequence Recall',
    description:
      'Watch a sequence carefully, then reproduce it in the same order.',
    meta: '3–5 rounds · About 3–5 min',
  },
]

export default function Games() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Cognitive Games"
        subtitle="Short, gentle activities for memory, attention and recall practice."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {games.map((game) => (
          <GameCard key={game.to} {...game} />
        ))}
      </div>

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-700">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            <Brain
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Gentle adaptive practice
            </h2>

            <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Your completed activities contribute to a personal
              performance summary. The system can suggest a
              comfortable practice level based on recent activity.
            </p>

            <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              These activities are designed for cognitive engagement
              and support. They are not medical diagnostic tests.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function GameCard({
  to,
  icon: Icon,
  title,
  description,
  meta,
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border bg-white p-7 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
        <Icon
          className="h-8 w-8"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>

      <p className="mt-2 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
        {description}
      </p>

      <p className="mt-5 inline-flex items-center text-base font-semibold text-teal-700 dark:text-teal-400">
        {meta}

        <ChevronRight
          className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </p>

      <div className="mt-6">
        <span className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal-700 px-6 text-base font-semibold text-white transition-colors group-hover:bg-teal-800">
          Start activity
        </span>
      </div>
    </Link>
  )
}