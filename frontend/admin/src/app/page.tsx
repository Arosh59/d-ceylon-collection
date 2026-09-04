import Link from "next/link";

import { getDashboardData } from "@/lib/admin-dashboard";
import { ADMIN_MODULES } from "@/lib/admin-modules";
import { requireAdministrator } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await requireAdministrator();
  const dashboard = await getDashboardData();
  const stats = [
    ["Published products", dashboard.counts.publishedProducts, "/modules/products"],
    ["Destinations", dashboard.counts.publishedDestinations, "/modules/destinations"],
    ["Customers", dashboard.counts.customers, "/modules/customers"],
    ["Bookings", dashboard.counts.bookings, "/modules/bookings"],
    ["Pending quotes", dashboard.counts.pendingQuotes, "/modules/quotes"],
    ["Open tasks", dashboard.counts.openTasks, "/modules/tasks"],
  ] as const;

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-5 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-60">
          <p className="text-sm font-bold tracking-[0.16em] text-gold uppercase">D Ceylon</p>
          <h1 className="mt-3 text-3xl font-serif">Administration</h1>
          <nav aria-label="Administration modules" className="mt-8 grid gap-1">
            {ADMIN_MODULES.slice(0, 10).map((module) => (
              <Link className="rounded-xl px-3 py-2 text-sm transition hover:bg-navy/6" href={`/modules/${module.slug}`} key={module.slug}>
                {module.name}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-navy/10 pb-8">
            <p className="text-sm font-bold tracking-[0.16em] text-gold uppercase">Overview</p>
            <h2 className="mt-3 text-4xl font-serif sm:text-5xl">Welcome, {session.user?.name ?? "Administrator"}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">A live view of the records currently available to your administrator account.</p>
          </header>

          {dashboard.warning ? <p className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm leading-6 text-navy" role="status">{dashboard.warning}</p> : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map(([label, value, href]) => (
              <Link className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gold" href={href} key={label}>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-3 text-4xl font-semibold">{value ?? "—"}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm" aria-labelledby="activity-heading">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-2xl font-serif" id="activity-heading">Recent activity</h3>
                <span className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Live records</span>
              </div>
              {dashboard.recentActivity.length ? (
                <ul className="mt-5 divide-y divide-navy/8">
                  {dashboard.recentActivity.map((activity, index) => (
                    <li className="flex items-start justify-between gap-4 py-4 text-sm" key={`${activity.eventType}-${activity.occurredAtUtc}-${index}`}>
                      <span><strong className="font-semibold">{activity.eventType.replaceAll("-", " ")}</strong><span className="mt-1 block text-slate-500">{activity.outcome}</span></span>
                      <time className="shrink-0 text-slate-500" dateTime={activity.occurredAtUtc}>{formatDate(activity.occurredAtUtc)}</time>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-5 rounded-xl bg-canvas p-5 text-sm leading-6 text-slate-600">No audit activity is available for this local session yet.</p>}
            </section>
            <section className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm" aria-labelledby="status-heading">
              <h3 className="text-2xl font-serif" id="status-heading">Workflow status</h3>
              {dashboard.bookingStatuses.length || dashboard.quoteStatuses.length ? (
                <div className="mt-5 grid gap-5">
                  <StatusChart label="Bookings" values={dashboard.bookingStatuses} />
                  <StatusChart label="Quotes" values={dashboard.quoteStatuses} />
                </div>
              ) : <p className="mt-5 rounded-xl bg-canvas p-5 text-sm leading-6 text-slate-600">Status charts will appear when operational records are available to this session.</p>}
            </section>
            <section className="rounded-2xl border border-navy/10 bg-navy p-6 text-white shadow-sm" aria-labelledby="quick-actions-heading">
              <h3 className="text-2xl font-serif" id="quick-actions-heading">Quick actions</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">Jump straight to the records most often reviewed by the team.</p>
              <div className="mt-6 grid gap-3">
                <Link className="rounded-xl bg-gold px-4 py-3 text-center text-sm font-semibold text-navy hover:bg-gold/90" href="/modules/products">Review products</Link>
                <Link className="rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-semibold hover:bg-white/10" href="/modules/destinations">Review destinations</Link>
                <Link className="rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-semibold hover:bg-white/10" href="/modules/tasks">View operations tasks</Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusChart({ label, values }: { label: string; values: { status: string; count: number }[] }) {
  const maximum = Math.max(1, ...values.map((value) => value.count));
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-600">{label}</h4>
      <ul className="mt-3 grid gap-3">
        {values.map((value) => (
          <li key={`${label}-${value.status}`}>
            <div className="flex justify-between gap-3 text-xs text-slate-500"><span className="capitalize">{value.status.replaceAll("-", " ")}</span><span>{value.count}</span></div>
            <div aria-hidden="true" className="mt-1 h-2 overflow-hidden rounded-full bg-navy/8"><span className="block h-full rounded-full bg-gold" style={{ width: `${(value.count / maximum) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Recently" : new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(date);
}
