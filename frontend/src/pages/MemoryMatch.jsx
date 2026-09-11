import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Clock, Play, RotateCcw, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { addJson } from '../lib/storage'
import { api } from '../lib/api'

const STORAGE_KEY = 'memorycare_game_results'

const SYMBOLS = [
  { emoji: '🌾', label: 'Rice' },
  { emoji: '🥭', label: 'Mango' },
  { emoji: '🍌', label: 'Banana' },
  { emoji: '🍵', label: 'Tea' },
  { emoji: '🌸', label: 'Flower' },
  { emoji: '🐟', label: 'Fish' },
  { emoji: '🏠', label: 'House' },
  { emoji: '🌳', label: 'Tree' },
]

function shuffle(items) {
  const next = [...items]

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }

  return next
}

function buildDeck(difficulty) {
  const pairCount = difficulty === 'medium' ? 8 : 6
  const selected = SYMBOLS.slice(0, pairCount)

  return shuffle(
    selected.flatMap((symbol, index) => [
      { id: `${index}-a`, pairId: index, ...symbol },
      { id: `${index}-b`, pairId: index, ...symbol },
    ]),
  )
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function scoreGame({
  totalPairs,
  mistakes,
  duration,
  difficulty,
}) {
  const attempts = totalPairs + mistakes

  const accuracy =
    attempts === 0
      ? 0
      : Math.round((totalPairs / attempts) * 100)

  const timePenalty = Math.min(
    25,
    Math.floor(duration / 8),
  )

  const difficultyBonus =
    difficulty === 'medium' ? 10 : 0

  const score = Math.max(
    0,
    Math.round(
      accuracy * 0.85 +
        difficultyBonus -
        timePenalty,
    ),
  )

  return { score, accuracy }
}

export default function MemoryMatch() {
  const [phase, setPhase] = useState('start')
  const [difficulty, setDifficulty] = useState('easy')
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [matches, setMatches] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const timeoutRef = useRef(null)

  const totalPairs =
    difficulty === 'medium' ? 8 : 6

  useEffect(() => {
    if (phase !== 'playing') {
      return undefined
    }

    const id = window.setInterval(() => {
      setSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  function startGame(nextDifficulty = difficulty) {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    setDifficulty(nextDifficulty)
    setCards(buildDeck(nextDifficulty))
    setFlipped([])
    setMatched([])
    setMistakes(0)
    setMatches(0)
    setSeconds(0)
    setBusy(false)
    setResult(null)
    setPhase('playing')
  }

  function finishGame(
    finalMatches,
    finalMistakes,
    duration,
  ) {
    const { score, accuracy } = scoreGame({
      totalPairs,
      mistakes: finalMistakes,
      duration,
      difficulty,
    })

    const gameResult = {
      game_type: 'memory_match',
      score,
      accuracy,
      mistakes: finalMistakes,
      response_time_seconds: duration,
      difficulty,
      completed: true,
      played_at: new Date().toISOString(),
    }

    addJson(STORAGE_KEY, gameResult)

    api('/games/results', {
      method: 'POST',
      body: JSON.stringify(gameResult),
    }).catch(() => {})

    setResult({
      ...gameResult,
      matches: finalMatches,
      totalPairs,
      duration,
    })

    setPhase('results')
  }

  function handleCardClick(index) {
    if (phase !== 'playing' || busy) return
    if (flipped.includes(index) || matched.includes(index)) {
      return
    }

    if (flipped.length >= 2) return

    const nextFlipped = [...flipped, index]

    setFlipped(nextFlipped)

    if (nextFlipped.length < 2) return

    const [firstIndex, secondIndex] = nextFlipped

    const first = cards[firstIndex]
    const second = cards[secondIndex]

    setBusy(true)

    if (first.pairId === second.pairId) {
      const nextMatched = [
        ...matched,
        firstIndex,
        secondIndex,
      ]

      const nextMatches = matches + 1

      timeoutRef.current = window.setTimeout(() => {
        setMatched(nextMatched)
        setMatches(nextMatches)
        setFlipped([])
        setBusy(false)

        if (nextMatches === totalPairs) {
          finishGame(
            nextMatches,
            mistakes,
            seconds,
          )
        }
      }, 450)

      return
    }

    timeoutRef.current = window.setTimeout(() => {
      setMistakes((value) => value + 1)
      setFlipped([])
      setBusy(false)
    }, 900)
  }

  function isFaceUp(index) {
    return (
      flipped.includes(index) ||
      matched.includes(index)
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg text-slate-600">
          Flip two cards and find matching pairs.
        </p>

        <Link
          to="/games"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-5 text-base font-semibold text-slate-800 hover:bg-slate-50"
        >
          <ArrowLeft
            className="h-5 w-5"
            aria-hidden="true"
          />
          Back to Games
        </Link>
      </div>

      {phase === 'start' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-900">
            Memory Match
          </h2>

          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
            Match familiar objects. Choose a difficulty,
            then press Start Game. Cards begin face-down.
          </p>

          <fieldset className="mt-8">
            <legend className="text-lg font-semibold text-slate-900">
              Difficulty
            </legend>

            <div className="mt-3 flex flex-wrap gap-3">
              {[
                {
                  id: 'easy',
                  label: 'Easy',
                  detail: '6 pairs · 12 cards',
                },
                {
                  id: 'medium',
                  label: 'Medium',
                  detail: '8 pairs · 16 cards',
                },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setDifficulty(option.id)
                  }
                  className={`min-h-16 min-w-44 rounded-xl border px-5 py-3 text-left ${
                    difficulty === option.id
                      ? 'border-teal-700 bg-teal-50 text-slate-900'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xl font-semibold">
                    {option.label}
                  </span>

                  <span className="block text-base text-slate-600">
                    {option.detail}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => startGame()}
            className="mt-8 inline-flex min-h-14 items-center gap-2 rounded-xl bg-teal-700 px-8 text-lg font-semibold text-white hover:bg-teal-800"
          >
            <Play
              className="h-5 w-5"
              aria-hidden="true"
            />
            Start Game
          </button>
        </section>
      ) : null}

      {phase === 'playing' ? (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg">
              <p className="font-medium text-slate-600">
                Time
              </p>

              <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
                <Clock
                  className="h-6 w-6 text-teal-800"
                  aria-hidden="true"
                />
                {formatTime(seconds)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg">
              <p className="font-medium text-slate-600">
                Matches
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {matches} / {totalPairs}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg">
              <p className="font-medium text-slate-600">
                Mistakes
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {mistakes}
              </p>
            </div>
          </div>

          <div
            className={`grid gap-3 ${
              totalPairs === 8
                ? 'grid-cols-4'
                : 'grid-cols-3 sm:grid-cols-4'
            }`}
          >
            {cards.map((card, index) => {
              const faceUp = isFaceUp(index)

              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={busy || faceUp}
                  onClick={() =>
                    handleCardClick(index)
                  }
                  aria-label={
                    faceUp
                      ? card.label
                      : 'Hidden card'
                  }
                  className={`flex min-h-28 flex-col items-center justify-center rounded-2xl border-2 p-3 text-center sm:min-h-32 ${
                    matched.includes(index)
                      ? 'border-teal-700 bg-teal-50'
                      : faceUp
                        ? 'border-slate-400 bg-white'
                        : 'border-slate-300 bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {faceUp ? (
                    <>
                      <span
                        className="text-5xl leading-none"
                        aria-hidden="true"
                      >
                        {card.emoji}
                      </span>

                      <span className="mt-2 text-lg font-semibold text-slate-900">
                        {card.label}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-semibold">
                      ?
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      {phase === 'results' && result ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
              <Trophy
                className="h-8 w-8"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-slate-900">
                Great job!
              </h2>

              <p className="mt-2 text-lg text-slate-600">
                You matched all {result.totalPairs} pairs.
              </p>
            </div>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-base text-slate-600">
                Score
              </dt>

              <dd className="text-3xl font-semibold text-slate-900">
                {result.score}
              </dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-base text-slate-600">
                Accuracy
              </dt>

              <dd className="text-3xl font-semibold text-slate-900">
                {result.accuracy}%
              </dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-base text-slate-600">
                Mistakes
              </dt>

              <dd className="text-3xl font-semibold text-slate-900">
                {result.mistakes}
              </dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-base text-slate-600">
                Time
              </dt>

              <dd className="text-3xl font-semibold text-slate-900">
                {formatTime(result.duration)}
              </dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <dt className="text-base text-slate-600">
                Difficulty
              </dt>

              <dd className="text-3xl font-semibold capitalize text-slate-900">
                {result.difficulty}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setPhase('start')
                setResult(null)
              }}
              className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-teal-700 px-8 text-lg font-semibold text-white hover:bg-teal-800"
            >
              <RotateCcw
                className="h-5 w-5"
                aria-hidden="true"
              />
              Play Again
            </button>

            <Link
              to="/games"
              className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-slate-300 px-8 text-lg font-semibold text-slate-800 hover:bg-slate-50"
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
    </div>
  )
}