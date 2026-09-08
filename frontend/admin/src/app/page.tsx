import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { getDashboardData } from "@/lib/admin-dashboard";
import { requireAdministrator } from "@/lib/auth";
import { getAdminAuthenticationEnvironment } from "@/lib/auth-environment";

export default async function DashboardPage() {
  const session = await requireAdministrator();
  const environment = getAdminAuthenticationEnvironment();
  const dashboard = await getDashboardData();
  const stats = [
    {
      label: "Published products",
      value: dashboard.counts.publishedProducts,
      href: "/modules/products",
      detail: "Live catalogue",
      unavailableLabel: "Catalogue API unavailable",
    },
    {
      label: "Destinations",
      value: dashboard.counts.publishedDestinations,
      href: "/modules/destinations",
      detail: "Published places",
      unavailableLabel: "Catalogue API unavailable",
    },
    {
      label: "Customers",
      value: dashboard.counts.customers,
      href: "/modules/customers",
      detail: "Protected records",
      unavailableLabel: "Managed access required",
    },
    {
      label: "Bookings",
      value: dashboard.counts.bookings,
      href: "/modules/bookings",
      detail: "All booking states",
      unavailableLabel: "Managed access required",
    },
    {
      label: "Pending quotes",
      value: dashboard.counts.pendingQuotes,
      href: "/modules/quotes",
      detail: "Draft or sent",
      unavailableLabel: "Managed access required",
    },
    {
      label: "Open tasks",
      value: dashboard.counts.openTasks,
      href: "/modules/tasks",
      detail: "Operations queue",
      unavailableLabel: "Managed access required",
    },
  ] as const;

  return (
    <AdminShell
      authenticationMode={environment.authenticationMode}
      description="A focused view of catalogue health, customer activity, and operational work."
      eyebrow="Workspace overview"
      title={`Good day, ${session.user.name ?? "Administrator"}`}
      user={session.user}
    >
      <div
        className={
          dashboard.source === "administrator-api" ? "source-banner live" : "source-banner"
        }
        role="status"
      >
        <span className="source-icon" aria-hidden="true">
          {dashboard.source === "administrator-api"
            ? "✓"
            : dashboard.source === "unavailable"
              ? "!"
              : "i"}
        </span>
        <span>
          <strong>
            {dashboard.source === "administrator-api"
              ? "Operational data is live"
              : dashboard.source === "unavailable"
                ? "Signed in · backend data unavailable"
                : "Catalogue-only development view"}
          </strong>
          <small>
            {dashboard.warning ??
              "Counts and workflow activity are loaded from the protected administrator API."}
          </small>
        </span>
      </div>

      <section className="mt-8" aria-labelledby="summary-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">At a glance</p>
            <h2 className="section-heading" id="summary-heading">
              Platform summary
            </h2>
          </div>
          <p className="text-sm text-slate-500">Select a card to review its records</p>
        </div>
        <div className="stat-grid">
          {stats.map((stat) => (
            <Link className="stat-card" href={stat.href} key={stat.label}>
              <span className="stat-card-topline">
                <span>{stat.label}</span>
                <span aria-hidden="true">↗</span>
              </span>
              {stat.value === null ? (
                <span className="stat-unavailable">{stat.unavailableLabel}</span>
              ) : (
                <strong className="stat-value">{stat.value.toLocaleString("en-LK")}</strong>
              )}
              <small>{stat.detail}</small>
            </Link>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel" aria-labelledby="activity-heading">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Security and access</p>
              <h2 className="section-heading" id="activity-heading">
                Recent activity
              </h2>
            </div>
            <span className="panel-label">Latest 8</span>
          </div>
          {dashboard.recentActivity.length ? (
            <ul className="activity-list">
              {dashboard.recentActivity.map((activity, index) => (
                <li key={`${activity.eventType}-${activity.occurredAtUtc}-${index}`}>
                  <span className="activity-marker" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <strong>{sentenceCase(activity.eventType)}</strong>
                    <small>
                      {sentenceCase(activity.outcome)}
                      {activity.subject ? ` · ${activity.subject}` : ""}
                    </small>
                  </span>
                  <time dateTime={activity.occurredAtUtc}>
                    {formatDate(activity.occurredAtUtc)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              description="Audit events will appear here when a managed administrator session is connected."
              title="No activity available"
            />
          )}
        </section>

        <div className="grid content-start gap-6">
          <section className="panel" aria-labelledby="status-heading">
            <p className="eyebrow">Work in progress</p>
            <h2 className="section-heading" id="status-heading">
              Workflow status
            </h2>
            {dashboard.bookingStatuses.length || dashboard.quoteStatuses.length ? (
              <div className="mt-6 grid gap-6">
                <StatusChart label="Bookings" values={dashboard.bookingStatuses} />
                <StatusChart label="Quotes" values={dashboard.quoteStatuses} />
              </div>
            ) : (
              <EmptyState
                description="Booking and quote breakdowns need managed administrator access."
                title="No workflow data"
              />
            )}
          </section>

          <section className="quick-actions" aria-labelledby="quick-actions-heading">
            <p className="eyebrow text-gold">Shortcuts</p>
            <h2 className="section-heading text-white" id="quick-actions-heading">
              Common reviews
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Jump directly to records the team checks most often.
            </p>
            <div className="mt-6 grid gap-2">
              <Link className="quick-action primary" href="/modules/products">
                Review products <span aria-hidden="true">→</span>
              </Link>
              <Link className="quick-action" href="/modules/destinations">
                Review destinations <span aria-hidden="true">→</span>
              </Link>
              <Link className="quick-action" href="/modules/tasks">
                View operations tasks <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">—</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function StatusChart({
  label,
  values,
}: {
  label: string;
  values: { status: string; count: number }[];
}) {
  const maximum = Math.max(1, ...values.map((value) => value.count));
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
      <ul className="mt-3 grid gap-3">
        {values.map((value) => (
          <li key={`${label}-${value.status}`}>
            <div className="flex justify-between gap-3 text-xs text-slate-500">
              <span>{sentenceCase(value.status)}</span>
              <span className="font-semibold text-navy">{value.count.toLocaleString("en-LK")}</span>
            </div>
            <div aria-hidden="true" className="status-track">
              <span style={{ width: `${(value.count / maximum) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Recently"
    : new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(date);
}

function sentenceCase(value: string): string {
  const normalized = value.replaceAll("-", " ").replaceAll("_", " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
