export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto min-h-screen max-w-7xl p-5 sm:p-8 lg:p-10">
      <p className="text-sm font-bold tracking-[0.16em] text-gold uppercase">Administration</p>
      <div aria-hidden="true" className="mt-6 h-12 w-2/3 animate-pulse rounded-xl bg-navy/10" />
      <p className="mt-4 text-sm text-slate-600" role="status">Loading live dashboard data…</p>
      <div aria-hidden="true" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <div className="h-32 animate-pulse rounded-2xl bg-navy/8" key={index} />)}
      </div>
    </main>
  );
}
