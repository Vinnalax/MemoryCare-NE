import {
  Bell,
  Brain,
  HeartHandshake,
  LayoutDashboard,
  Puzzle,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  {
    to: '/patient',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/games',
    label: 'Cognitive Games',
    icon: Puzzle,
  },
  {
    to: '/memories',
    label: 'Memories',
    icon: HeartHandshake,
  },
  {
    to: '/reminders',
    label: 'Reminders',
    icon: Bell,
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: TrendingUp,
  },
  {
    to: '/caregiver',
    label: 'Caregiver Dashboard',
    icon: Users,
  },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-svh w-72 shrink-0 flex-col border-r border-slate-200 bg-white text-slate-900 shadow-sm transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-6 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
              <Brain className="h-6 w-6" aria-hidden="true" />
            </div>

            <div>
              <p className="text-xl font-semibold leading-tight text-slate-900 dark:text-white">
                MemoryCare NE
              </p>

              <p className="mt-1 text-sm leading-snug text-slate-500 dark:text-slate-400">
                Memory &amp; Cognitive Support
              </p>
            </div>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav
          className="min-h-0 flex-1 overflow-y-auto p-4"
          aria-label="Main navigation"
        >
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menu
          </p>

          <div className="space-y-1.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive
                    ? 'flex min-h-12 items-center gap-3 rounded-xl bg-teal-700 px-4 py-3 text-lg font-medium text-white shadow-sm'
                    : 'mc-sidebar-item flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-lg font-medium text-slate-700 dark:text-slate-300'
                }
              >
                <Icon
                  className="h-6 w-6 shrink-0"
                  aria-hidden="true"
                />

                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            MemoryCare NE
          </p>

          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Cognitive support platform
          </p>
        </div>
      </aside>

      <div
        className="hidden w-72 shrink-0 lg:block"
        aria-hidden="true"
      />
    </>
  )
}