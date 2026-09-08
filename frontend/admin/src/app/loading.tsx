export default function Loading() {
  return (
    <main aria-busy="true" className="min-h-screen bg-canvas p-5 sm:p-8 lg:p-12">
      <div className="mx-auto max-w-6xl">
        <div aria-hidden="true" className="h-4 w-32 animate-pulse rounded-full bg-gold/25" />
        <div
          aria-hidden="true"
          className="mt-5 h-14 w-2/3 max-w-xl animate-pulse rounded-xl bg-navy/10"
        />
        <p className="mt-4 text-sm text-slate-600" role="status">
          Loading administrator workspace…
        </p>
        <div aria-hidden="true" className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="h-36 animate-pulse rounded-2xl bg-navy/8" key={index} />
          ))}
        </div>
        <div aria-hidden="true" className="mt-4 h-72 animate-pulse rounded-2xl bg-navy/8" />
      </div>
    </main>
  );
}
