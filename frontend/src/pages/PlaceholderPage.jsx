import PageHeader from '../components/PageHeader'

export default function PlaceholderPage({ title, description }) {
  return (
    <section>
      <PageHeader title={title} subtitle={description} />
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-lg leading-relaxed text-slate-700">
          This section is coming next. The layout stays the same so you can move
          between pages from the sidebar.
        </p>
      </div>
    </section>
  )
}
