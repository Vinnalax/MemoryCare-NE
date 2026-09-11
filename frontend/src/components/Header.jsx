import {
  Menu,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react'

const pageTitles = {
  '/patient': 'Patient Dashboard',
  '/games': 'Cognitive Games',
  '/games/memory-match': 'Memory Match',
  '/games/sequence': 'Sequence Recall',
  '/memories': 'Memories',
  '/reminders': 'Reminders',
  '/progress': 'Progress',
  '/caregiver': 'Caregiver Dashboard',
}

function formatToday() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Header({
  pathname,
  onMenuClick,
  theme,
  onToggleTheme,
}) {
  const title = pageTitles[pathname] ?? 'MemoryCare NE'
  const isDark = theme === 'dark'

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-xl p-2 text-slate-800 transition-colors hover:bg-slate-100 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu className="h-7 w-7" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-slate-900 sm:text-3xl">
              {title}
            </h1>

            <p className="mt-0.5 text-base text-slate-600">
              Today’s Overview · {formatToday()}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100"
            aria-label={
              isDark
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            title={
              isDark
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
          >
            {isDark ? (
              <Sun
                className="h-6 w-6"
                aria-hidden="true"
              />
            ) : (
              <Moon
                className="h-6 w-6"
                aria-hidden="true"
              />
            )}
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-white">
              <UserRound
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <div className="hidden sm:block">
              <p className="text-base font-semibold text-slate-900">
                Asha Devi
              </p>

              <p className="text-sm text-slate-600">
                Patient profile
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}