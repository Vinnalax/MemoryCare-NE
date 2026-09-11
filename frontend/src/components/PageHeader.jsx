export default function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-lg text-slate-600 sm:text-xl">{subtitle}</p>
      ) : null}
    </div>
  )
}
