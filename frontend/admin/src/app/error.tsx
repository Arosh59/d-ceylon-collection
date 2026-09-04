"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="w-full max-w-xl rounded-3xl border border-navy/10 bg-white p-8 text-center shadow-xl">
        <p className="text-sm font-bold tracking-[0.16em] text-gold uppercase">Dashboard unavailable</p>
        <h1 className="mt-4 text-4xl font-serif">The live records could not be loaded.</h1>
        <p className="mt-4 leading-7 text-slate-600">Check that the API and database are running, then try the dashboard again.</p>
        <button className="mt-7 rounded-full bg-navy px-6 py-3 font-semibold text-white hover:bg-navy/85" onClick={reset} type="button">Try again</button>
      </section>
    </main>
  );
}
