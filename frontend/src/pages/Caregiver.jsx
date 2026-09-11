import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Bell,
  Brain,
  CheckCircle2,
  Clock3,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { RESULTS_KEY, readJson } from '../lib/storage'
import { api } from '../lib/api'

export default function Caregiver() {
  const [results, setResults] = useState(() =>
    readJson(RESULTS_KEY, []),
  )
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([
      api('/games/results'),
      api('/analysis'),
    ])
      .then(([gameResults, analysisData]) => {
        if (!active) return

        if (Array.isArray(gameResults)) {
          setResults([...gameResults].reverse())
        }

        setAnalysis(analysisData)
      })
      .catch(() => {
        // Local storage already provides a usable fallback.
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const trend = useMemo(
    () =>
      results.slice(-8).map((result, index) => ({
        session: index + 1,
        score: Number(result.score) || 0,
        accuracy: Number(result.accuracy) || 0,
      })),
    [results],
  )

  const averageAccuracy =
    Number(analysis?.average_accuracy) ||
    (results.length
      ? Math.round(
          results.reduce(
            (total, result) =>
              total + Number(result.accuracy || 0),
            0,
          ) / results.length,
        )
      : 0)

  const cognitiveScore =
    Number(analysis?.cognitive_score) ||
    (results.length
      ? Math.round(
          results.reduce(
            (total, result) =>
              total + Number(result.score || 0),
            0,
          ) / results.length,
        )
      : 0)

  const status =
    analysis?.trend || 'Getting started'

  const StatusIcon =
    status === 'Improving'
      ? TrendingUp
      : status === 'Needs gentle practice'
        ? TrendingDown
        : Activity

  const trendDescription =
    status === 'Improving'
      ? 'Recent activity shows a positive performance pattern.'
      : status === 'Needs gentle practice'
        ? 'Recent activity suggests that calm, regular practice may be helpful.'
        : 'Complete more activities to build a clearer performance pattern.'

  const focusArea =
    analysis?.focus_area || 'Complete an activity first'

  const strongestActivity =
    analysis?.strongest_game || 'Not enough activity yet'

  const activitiesCompleted =
    Number(analysis?.games_completed) || results.length

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Caregiver Dashboard"
        subtitle="A simple overview of cognitive activity, progress and personalized practice guidance."
      />

      {/* Patient profile */}
      <section
        aria-labelledby="patient-profile"
        className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              <Users
                className="h-7 w-7"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Patient profile
              </p>

              <h2
                id="patient-profile"
                className="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              >
                Asha Devi
              </h2>

              <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                Personalized cognitive-support activities
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-5 py-4 dark:bg-slate-800">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Activities completed
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {activitiesCompleted}
            </p>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section
        aria-labelledby="caregiver-summary"
        className="mt-6"
      >
        <div className="mb-4">
          <h2
            id="caregiver-summary"
            className="text-xl font-bold text-slate-900 dark:text-white"
          >
            Activity overview
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            These measures summarize recorded cognitive-game activity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={Brain}
            label="Practice Score"
            value={cognitiveScore || '—'}
            hint="Personal activity measure"
          />

          <StatCard
            icon={Target}
            label="Accuracy"
            value={
              averageAccuracy
                ? `${averageAccuracy}%`
                : '—'
            }
            hint="Average successful responses"
          />

          <StatCard
            icon={StatusIcon}
            label="Trend"
            value={status}
            hint="Recent performance pattern"
          />

          <StatCard
            icon={CheckCircle2}
            label="Strongest Activity"
            value={strongestActivity}
            hint="Based on recorded performance"
          />
        </div>
      </section>

      {/* Activity interpretation */}
      <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            <Activity
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              What the activity shows
            </h2>

            <p className="mt-1 text-base leading-7 text-slate-600 dark:text-slate-300">
              {trendDescription}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <Brain
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Activities
                </div>

                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {activitiesCompleted}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <Clock3
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Focus area
                </div>

                <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                  {focusArea}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <Target
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Strongest
                </div>

                <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                  {strongestActivity}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Performance + insight */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Recent performance
              </h2>

              <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                Score and accuracy across recent activities.
              </p>
            </div>

            {trend.length ? (
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Last {trend.length}{' '}
                {trend.length === 1 ? 'session' : 'sessions'}
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-800">
              <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                Loading activity...
              </p>
            </div>
          ) : trend.length ? (
            <>
              <div className="mt-5 h-72">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={trend}
                    margin={{
                      top: 8,
                      right: 12,
                      left: 0,
                      bottom: 8,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />

                    <XAxis
                      dataKey="session"
                      tick={{ fontSize: 13 }}
                      label={{
                        value: 'Activity',
                        position: 'insideBottom',
                        offset: -4,
                      }}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 13 }}
                      width={42}
                    />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="score"
                      strokeWidth={3}
                      name="Score"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      strokeWidth={3}
                      name="Accuracy"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                <span>
                  <strong className="text-slate-700 dark:text-slate-200">
                    Score:
                  </strong>{' '}
                  overall game performance
                </span>

                <span>
                  <strong className="text-slate-700 dark:text-slate-200">
                    Accuracy:
                  </strong>{' '}
                  successful responses
                </span>
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-800">
              <Brain
                className="mx-auto h-10 w-10 text-slate-400"
                aria-hidden="true"
              />

              <p className="mt-3 text-lg font-bold text-slate-700 dark:text-slate-200">
                No activity yet
              </p>

              <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                Complete a cognitive activity to populate the
                caregiver trend.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              <Brain
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Activity insight
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Based on recorded activity
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-teal-50 p-4 dark:bg-teal-950/40">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-300">
              Current pattern
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {status}
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Focus area
            </p>

            <p className="mt-1 font-bold text-slate-900 dark:text-white">
              {focusArea}
            </p>
          </div>

          {analysis?.recommendation ? (
            <div className="mt-4 rounded-xl border border-teal-100 bg-white p-4 dark:border-teal-800 dark:bg-slate-800">
              <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                Personalized suggestion
              </p>

              <p className="mt-1 font-semibold leading-relaxed text-slate-900 dark:text-white">
                {analysis.recommendation}
              </p>

              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Based on activity performance, not a medical assessment.
              </p>
            </div>
          ) : null}
        </section>
      </div>

      {/* Caregiver guidance */}
      <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            <Bell
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Caregiver guidance
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Simple ways to support comfortable practice
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Guidance
            title="Keep sessions short"
            text="Encourage comfortable, regular practice rather than long sessions."
          />

          <Guidance
            title="Focus on accuracy"
            text="If performance drops, return to an easier activity level."
          />

          <Guidance
            title="Watch the trend"
            text="Persistent concerns should be discussed with a qualified healthcare professional."
          />
        </div>
      </section>

      {/* Safety note */}
      <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-relaxed text-slate-600 dark:border-amber-800 dark:bg-amber-950/40 dark:text-slate-300">
        <strong className="text-slate-800 dark:text-slate-100">
          Important:
        </strong>{' '}
        These insights summarize cognitive-game activity for
        caregiver support. They are not a diagnosis and should not
        replace professional medical evaluation.
      </div>
    </div>
  )
}

function Guidance({ title, text }) {
  return (
    <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800">
      <p className="text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </p>

      <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
        {text}
      </p>
    </div>
  )
}