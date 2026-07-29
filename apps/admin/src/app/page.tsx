import Link from "next/link";

import { ADMIN_MODULES } from "@/lib/admin-modules";
import { requireAdministrator } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await requireAdministrator();
  return (
    <main className="mx-auto max-w-7xl p-6 sm:p-10">
      <p className="text-sm font-bold tracking-[0.16em] text-gold uppercase">
        Administrator workspace
      </p>
      <h1 className="mt-3 text-5xl font-serif">Welcome, {session.user?.name ?? "Administrator"}</h1>
      <p className="mt-5 max-w-3xl text-slate-600">
        This permission-aware foundation exposes navigation only. Every future administrative
        mutation must be backed by a versioned API policy, audit event, server-side validation, and
        ownership rule.
      </p>
      <nav
        aria-label="Administration modules"
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {ADMIN_MODULES.map((module) => (
          <Link
            className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm hover:border-gold"
            href={`/modules/${module.slug}`}
            key={module.slug}
          >
            <h2 className="text-2xl font-serif">{module.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{module.description}</p>
          </Link>
        ))}
      </nav>
    </main>
  );
}
