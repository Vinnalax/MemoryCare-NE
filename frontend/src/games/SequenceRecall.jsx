import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Trophy,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { addJson } from '../lib/storage'
import { api } from '../lib/api'

const STORAGE_KEY = 'memorycare_game_results'

const LEVELS = {
  easy: 4,
  medium: 6,
  hard: 8,
}

const SYMBOLS = [
  '🌾',
  '🍵',
  '🐟',
  '🌸',
  '🏠',
  '🥭',
  '🌳',
  '🛖',
]

function shuffle(items) {
  const next = [...items]

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }

  return next
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function SequenceRecall() {
  const [difficulty, setDifficulty] = useState('easy')
  const [phase, setPhase] = useState('start')
  const [sequence, setSequence] = useState([])
  const [input, setInput] = useState([])
  const [round, setRound] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [result, setResult] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle')

  const timerRef = useRef(null)
  const roundTimeoutRef = useRef(null)
  const startedAtRef = useRef(0)

  const rounds =
    difficulty === 'easy'
      ? 3
      : difficulty === 'medium'
        ? 4
        : 5

  const sequenceLength = LEVELS[difficulty]

  useEffect(() => {
    if (phase !== 'playing' &&
        phase !== 'showing' &&
        phase !== 'input') {
      return undefined
    }

    timerRef.current = window.setInterval(() => {
      setSeconds((value) => value + 1)
    }, 1000)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [phase])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }

      if (roundTimeoutRef.current) {
        window.clearTimeout(roundTimeoutRef.current)
      }
    }
  }, [])

  function clearRoundTimer() {
    if (roundTimeoutRef.current) {
      window.clearTimeout(roundTimeoutRef.current)
      roundTimeoutRef.current = null
    }
  }

  function nextRound(nextRound) {
    clearRoundTimer()

    const nextSequence = shuffle(SYMBOLS).slice(
      0,
      sequenceLength,
    )

    setSequence(nextSequence)
    setInput([])
    setRound(nextRound)
    setPhase('showing')

    roundTimeoutRef.current =
      window.setTimeout(() => {
        setPhase('input')
      }, 1800 + sequenceLength * 220)
  }

  function start() {
    clearRoundTimer()

    setSeconds(0)
    setCorrect(0)
    setMistakes(0)
    setInput([])
    setResult(null)
    setSyncStatus('idle')

    startedAtRef.current = Date.now()

    nextRound(1)
  }

  function choose(symbol) {
    if (phase !== 'input') {
      return
    }

    const nextInput = [...input, symbol]
    setInput(nextInput)

    const index = nextInput.length - 1

    if (symbol !== sequence[index]) {
      const nextMistakes = mistakes + 1
      setMistakes(nextMistakes)

      if (round >= rounds) {
        finish(correct, nextMistakes)
      } else {
        roundTimeoutRef.current =
          window.setTimeout(() => {
            nextRound(round + 1)
          }, 700)
      }

      return
    }

    if (nextInput.length === sequence.length) {
      const nextCorrect = correct + 1
      setCorrect(nextCorrect)

      if (round >= rounds) {
        finish(nextCorrect, mistakes)
      } else {
        roundTimeoutRef.current =
          window.setTimeout(() => {
            nextRound(round + 1)
          }, 700)
      }
    }
  }

  async function finish(
    finalCorrect,
    finalMistakes,
  ) {
    clearRoundTimer()

    const accuracy = Math.round(
      (finalCorrect / rounds) * 100,
    )

    const duration = Math.max(
      1,
      Math.round(
        (Date.now() - startedAtRef.current) / 1000,
      ),
    )

    const score = Math.max(
      0,
      Math.round(
        accuracy * 0.9 -
          finalMistakes * 8 -
          Math.floor(duration / 12),
      ),
    )

    const gameResult = {
      game_type: 'sequence_recall',
      score,
      accuracy,
      mistakes: finalMistakes,
      response_time_seconds: duration,
      difficulty,
      completed: true,
      played_at: new Date().toISOString(),
    }

    addJson(STORAGE_KEY, gameResult)

    setResult(gameResult)
    setSyncStatus('saving')
    setPhase('results')

    try {
      await api('/games/results', {
        method: 'POST',
        body: JSON.stringify(gameResult),
      })

      setSyncStatus('synced')
    } catch {
      setSyncStatus('local')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Watch the order, then tap the objects in the same sequence.
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Take your time and concentrate on one step at a time.
          </p>
        </div>

        <Link
          to="/games"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-5 text-base font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft
            className="h-5 w-5"
            aria-hidden="true"
          />
          Back to Games
        </Link>
      </div>

      {phase === 'start' ? (
        <section className="rounded-2xl border bg-white p-8 shadow-sm dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              <Play
                className="h-7 w-7"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
                Sequence Recall
              </h2>

              <p className="mt-2 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Watch a sequence of familiar objects and then
                reproduce the same order.
              </p>
            </div>
          </div>

          <fieldset className="mt-8">
            <legend className="text-lg font-semibold text-slate-900 dark:text-white">
              Choose difficulty
            </legend>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {Object.entries(LEVELS).map(
                ([key, length]) => {
                  const selected =
                    difficulty === key

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setDifficulty(key)
                      }
                      className={`min-h-20 rounded-xl border px-5 py-4 text-left ${
                        selected
                          ? 'border-teal-700 bg-teal-50 text-slate-900 dark:border-teal-500 dark:bg-teal-950/50 dark:text-white'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="block text-xl font-semibold capitalize">
                        {key}
                      </span>

                      <span className="mt-1 block text-base text-slate-600 dark:text-slate-300">
                        {length} objects ·{' '}
                        {key === 'easy'
                          ? '3 rounds'
                          : key === 'medium'
                            ? '4 rounds'
                            : '5 rounds'}
                      </span>
                    </button>
                  )
                },
              )}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={start}
            className="mt-8 inline-flex min-h-14 items-center gap-2 rounded-xl bg-teal-700 px-8 text-lg font-semibold text-white hover:bg-teal-800"
          >
            <Play
              className="h-5 w-5"
              aria-hidden="true"
            />
            Start Exercise
          </button>
        </section>
      ) : null}

      {phase !== 'start' && phase !== 'results' ? (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <GameStat
              label="Round"
              value={`${round} / ${rounds}`}
            />

            <GameStat
              label="Time"
              value={formatTime(seconds)}
              icon={Clock}
            />

            <GameStat
              label="Correct rounds"
              value={correct}
            />
          </div>

          <section className="rounded-2xl border bg-white p-6 text-center shadow-sm dark:border-slate-700 sm:p-8">
            {phase === 'showing' ? (
              <>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Remember this order
                </p>

                <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                  Look carefully. The sequence will disappear shortly.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  {sequence.map((symbol, index) => (
                    <div
                      key={`${symbol}-${index}`}
                      className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300"
                    >
                      <span
                        className="text-5xl leading-none"
                        aria-hidden="true"
                      >
                        {symbol}
                      </span>

                      <span className="mt-2 text-sm font-semibold">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Your turn
                </p>

                <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                  Tap the objects in the order you remember.
                </p>

                <div className="mt-8 grid grid-cols-4 gap-3 sm:gap-4">
                  {SYMBOLS.map((symbol) => (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => choose(symbol)}
                      className="flex min-h-20 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-4xl transition-transform hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 sm:min-h-24 sm:text-5xl"
                      aria-label={`Choose ${symbol}`}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 px-5 py-4 dark:bg-slate-900">
                  <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                    Selected: {input.length} / {sequence.length}
                  </p>

                  {input.length > 0 ? (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {input.map((symbol, index) => (
                        <span
                          key={`${symbol}-${index}`}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-2xl dark:bg-teal-950/60"
                          aria-label={`Selected item ${index + 1}`}
                        >
                          {symbol}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </section>
        </section>
      ) : null}

      {phase === 'results' && result ? (
        <section className="rounded-2xl border bg-white p-8 shadow-sm dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              <Trophy
                className="h-8 w-8"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
                Well done!
              </h2>

              <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
                You completed the recall exercise.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm">
            {syncStatus === 'synced' ? (
              <>
                <CheckCircle2
                  className="h-5 w-5 text-teal-700 dark:text-teal-400"
                  aria-hidden="true"
                />

                <span className="text-teal-800 dark:text-teal-300">
                  Result saved to the MemoryCare NE backend.
                </span>
              </>
            ) : syncStatus === 'local' ? (
              <>
                <CheckCircle2
                  className="h-5 w-5 text-slate-500"
                  aria-hidden="true"
                />

                <span className="text-slate-600 dark:text-slate-300">
                  Result saved locally. Backend is currently unavailable.
                </span>
              </>
            ) : (
              <>
                <Upload
                  className="h-5 w-5 text-slate-500"
                  aria-hidden="true"
                />

                <span className="text-slate-600 dark:text-slate-300">
                  Saving result…
                </span>
              </>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <ResultStat
              label="Score"
              value={result.score}
            />

            <ResultStat
              label="Accuracy"
              value={`${result.accuracy}%`}
            />

            <ResultStat
              label="Mistakes"
              value={result.mistakes}
            />
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-5 dark:bg-slate-900">
            <p className="text-base text-slate-600 dark:text-slate-300">
              Difficulty
            </p>

            <p className="mt-1 text-2xl font-semibold capitalize text-slate-900 dark:text-white">
              {result.difficulty}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={start}
              className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-teal-700 px-8 text-lg font-semibold text-white hover:bg-teal-800"
            >
              <RotateCcw
                className="h-5 w-5"
                aria-hidden="true"
              />
              Play Again
            </button>

            <Link
              to="/progress"
              className="inline-flex min-h-14 items-center rounded-xl border border-slate-300 px-8 text-lg font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              View Progress
            </Link>

            <Link
              to="/games"
              className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-slate-300 px-8 text-lg font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft
                className="h-5 w-5"
                aria-hidden="true"
              />
              Back to Games
            </Link>
          </div>
        </section>
      ) : null}

      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Cognitive activity for engagement and support. This
        exercise is not a medical diagnostic test.
      </p>
    </div>
  )
}

function GameStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm dark:border-slate-700">
      <p className="font-medium text-slate-600 dark:text-slate-300">
        {label}
      </p>

      <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-white">
        {Icon ? (
          <Icon
            className="h-6 w-6 text-teal-700 dark:text-teal-400"
            aria-hidden="true"
          />
        ) : null}

        {value}
      </p>
    </div>
  )
}

function ResultStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-900">
      <p className="text-base text-slate-600 dark:text-slate-300">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  )
}