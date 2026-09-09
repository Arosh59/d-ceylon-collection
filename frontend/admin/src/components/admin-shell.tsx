import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ADMIN_MODULES } from "@/lib/admin-modules";

import { SignOutButton } from "./sign-out-button";

const navigationSlugs = [
  "collections",
  "destinations",
  "experiences",
  "accommodation",
  "catalogue",
  "product-types",
  "categories",
  "tags",
  "media",
  "journal",
  "contact",
  "customers",
  "quote-requests",
  "quotes",
  "bookings",
  "tasks",
  "users",
] as const;

interface AdminShellProps {
  children: ReactNode;
  currentModule?: string;
  description: string;
  eyebrow: string;
  title: string;
  user: { email?: string | null; name?: string | null };
}

export function AdminShell({
  children,
  currentModule,
  description,
  eyebrow,
  title,
  user,
}: AdminShellProps) {
  const navigation = navigationSlugs
    .map((slug) => ADMIN_MODULES.find((item) => item.slug === slug))
    .filter((item): item is (typeof ADMIN_MODULES)[number] => Boolean(item));

  return (
    <main className="admin-frame">
      <aside className="admin-sidebar">
        <Link className="brand-lockup" href="/" aria-label="D Ceylon administration dashboard">
          <Image
            alt=""
            className="brand-mark"
            height={48}
            priority
            src="/brand/d-ceylon-mark-navy.webp"
            width={48}
          />
          <span>
            <strong>D’Ceylon</strong>
            <small>Administration</small>
          </span>
        </Link>

        <nav aria-label="Administration" className="admin-navigation">
          <p className="navigation-label">Workspace</p>
          <Link className={!currentModule ? "navigation-link active" : "navigation-link"} href="/">
            <span aria-hidden="true">⌂</span>
            Overview
          </Link>
          <p className="navigation-label navigation-section">Records</p>
          {navigation.map((module) => (
            <Link
              aria-current={currentModule === module.slug ? "page" : undefined}
              className={
                currentModule === module.slug ? "navigation-link active" : "navigation-link"
              }
              href={`/modules/${module.slug}`}
              key={module.slug}
            >
              <span className="navigation-dot" aria-hidden="true" />
              {module.name}
            </Link>
          ))}
        </nav>

        <div className="sidebar-account">
          <span className="account-avatar" aria-hidden="true">
            {(user.name ?? user.email ?? "A").charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm">{user.name ?? "Administrator"}</strong>
            <small className="block truncate text-slate-500">
              {user.email ?? "Approved account"}
            </small>
          </span>
          <SignOutButton compact />
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="page-heading">{title}</h1>
            <p className="page-description">{description}</p>
          </div>
          <span className="mode-badge">
            <span className="mode-dot" aria-hidden="true" />
            NestJS authenticated
          </span>
        </header>
        {children}
      </section>
    </main>
  );
}
