export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
          <Icon
            className="h-6 w-6"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <p className="text-base font-medium text-slate-600 dark:text-slate-300">
            {label}
          </p>

          <p className="mt-1 break-words text-3xl font-semibold text-slate-900 dark:text-white">
            {value}
          </p>

          {hint ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}