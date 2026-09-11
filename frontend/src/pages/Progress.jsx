import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Brain,
  CheckCircle2,
  Clock3,
  Target,
  TrendingDown,
  TrendingUp,
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

export default function Progress() {
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

        if (analysisData && typeof analysisData === 'object') {
          setAnalysis(analysisData)
        }
      })
      .catch(() => {
        // Local storage remains available as a fallback.
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

  const chart = useMemo(
    () =>
      results.slice(-10).map((result, index) => ({
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

  const practiceScore =
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

  const trend =
    analysis?.trend ||
    (results.length >= 4 ? 'Improving' : 'Building baseline')

  const trendDelta = Number(analysis?.trend_delta ?? 0)

  const TrendIcon =
    trend === 'Improving'
      ? TrendingUp
      : trend === 'Needs gentle practice'
        ? TrendingDown
        : Activity

  const trendDescription =
    trend === 'Improving'
      ? 'Recent activity shows positive progress.'
      : trend === 'Needs gentle practice'
        ? 'Recent activity suggests that gentle, regular practice may help.'
        : 'Complete more activities to build a clearer personal trend.'

  const strongestGame =
    analysis?.strongest_game ||
    getStrongestGame(results)

  const focusArea =
    analysis?.focus_area ||
    getFocusArea(averageAccuracy)

  const summary =
    analysis?.summary ||
    getSummary(trend, averageAccuracy)

  const recommendation =
    analysis?.recommendation ||
    getRecommendation(averageAccuracy)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Progress"
        subtitle="A simple view of cognitive activity and personal performance trends."
      />

      {/* Overview */}
      <section aria-labelledby="progress-overview">
        <div className="mb-4">
          <h2
            id="progress-overview"
            className="text-xl font-bold text-slate-900 dark:text-white"
          >
            Your activity overview
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            These measures describe practice activity and game
            performance over time.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={Brain}
            label="Practice Score"
            value={practiceScore || '—'}
            hint="Personal activity measure"
          />

          <StatCard
            icon={Target}
            label="Average Accuracy"
            value={
              averageAccuracy
                ? `${averageAccuracy}%`
                : '—'
            }
            hint={`${results.length} ${
              results.length === 1 ? 'activity' : 'activities'
            } recorded`}
          />

          <StatCard
            icon={TrendIcon}
            label="Recent Trend"
            value={trend}
            hint={
              trendDelta
                ? `${trendDelta > 0 ? '+' : ''}${trendDelta} points`
                : 'Based on recent activity'
            }
          />
        </div>
      </section>

      {/* Activity summary */}
      <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            <Activity
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              What your activity shows
            </h2>

            <p className="mt-1 text-base leading-7 text-slate-600 dark:text-slate-300">
              {trendDescription}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoTile
                icon={Brain}
                label="Activities"
                value={results.length}
              />

              <InfoTile
                icon={Clock3}
                label="Latest focus"
                value={focusArea}
              />

              <InfoTile
                icon={Target}
                label="Strongest"
                value={strongestGame}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cognitive activity insight */}
      <section className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5 shadow-sm dark:border-teal-800 dark:bg-teal-950/40 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-300">
            <Brain
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">
              Cognitive activity insight
            </p>

            <h2 className="mt-1 text-xl font-bold leading-snug text-slate-900 dark:text-white">
              {summary}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              This insight is based on recorded cognitive-game
              activity and is intended to support practice and
              caregiver understanding.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-teal-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Focus area
                </p>

                <p className="mt-1 font-bold text-slate-900 dark:text-white">
                  {focusArea}
                </p>
              </div>

              <div className="rounded-xl border border-teal-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Strongest activity
                </p>

                <p className="mt-1 font-bold text-slate-900 dark:text-white">
                  {strongestGame}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized recommendation */}
      <section className="mt-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            <CheckCircle2
              className="h-6 w-6"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Personalized practice suggestion
            </p>

            <p className="mt-1 text-lg font-bold leading-relaxed text-slate-900 dark:text-white">
              {recommendation}
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              The suggestion is based on activity performance.
              It supports practice planning and is not a medical
              assessment or diagnosis.
            </p>
          </div>
        </div>
      </section>

      {/* Performance chart */}
      <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Performance trend
            </h2>

            <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
              Score and accuracy across recent activities
            </p>
          </div>

          {chart.length ? (
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Last {chart.length}{' '}
              {chart.length === 1 ? 'session' : 'sessions'}
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-800">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
              Loading activity...
            </p>
          </div>
        ) : chart.length ? (
          <>
            <div className="mt-6 h-80">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={chart}
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
          <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-800">
            <Brain
              className="mx-auto h-10 w-10 text-slate-400"
              aria-hidden="true"
            />

            <p className="mt-3 text-lg font-bold text-slate-700 dark:text-slate-200">
              No activity recorded yet.
            </p>

            <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
              Complete Memory Match or Sequence Recall to start
              building your personal trend.
            </p>
          </div>
        )}
      </section>

      {/* Safety note */}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-slate-600 dark:border-amber-800 dark:bg-amber-950/40 dark:text-slate-300">
        <strong className="text-slate-800 dark:text-slate-100">
          Important:
        </strong>{' '}
        MemoryCare NE tracks engagement and performance patterns
        to support daily cognitive activities. It does not diagnose
        dementia or other medical conditions.
      </div>
    </div>
  )
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
        <Icon
          className="h-4 w-4"
          aria-hidden="true"
        />

        {label}
      </div>

      <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  )
}

function getStrongestGame(results) {
  if (!results.length) {
    return 'Not enough activity yet'
  }

  const scores = {}

  results.forEach((result) => {
    const game = result.game_type || 'Unknown'
    const accuracy = Number(result.accuracy) || 0

    if (!scores[game]) {
      scores[game] = []
    }

    scores[game].push(accuracy)
  })

  const strongest = Object.entries(scores).sort(
    (a, b) =>
      average(b[1]) - average(a[1]),
  )[0]

  if (!strongest) {
    return 'Not enough activity yet'
  }

  return strongest[0]
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getFocusArea(accuracy) {
  if (!accuracy) {
    return 'Complete more activities'
  }

  if (accuracy >= 85) {
    return 'Ready for a little more challenge'
  }

  if (accuracy >= 65) {
    return 'Keep building consistent accuracy'
  }

  return 'Gentle accuracy practice'
}

function getSummary(trend, accuracy) {
  if (!accuracy) {
    return 'Start with a short cognitive activity to build a personal baseline.'
  }

  if (trend === 'Improving') {
    return `Recent performance is trending upward with an average accuracy of ${accuracy}%.`
  }

  if (trend === 'Needs gentle practice') {
    return `Recent activity suggests gentle practice may help improve consistency at the current pace.`
  }

  return `Recent activity shows an average accuracy of ${accuracy}%.`
}

function getRecommendation(accuracy) {
  if (!accuracy) {
    return 'Complete a short game to begin building a personal baseline.'
  }

  if (accuracy >= 85) {
    return 'Try Medium difficulty next while keeping sessions short and comfortable.'
  }

  if (accuracy >= 65) {
    return 'Continue regular practice and focus on steady, accurate responses.'
  }

  return 'Repeat Easy difficulty and focus on calm, accurate responses rather than speed.'
}

function average(values) {
  if (!values.length) {
    return 0
  }

  return (
    values.reduce(
      (total, value) => total + value,
      0,
    ) / values.length
  )
}