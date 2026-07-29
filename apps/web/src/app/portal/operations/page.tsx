import { OperationsApiError } from "@dceylon/sdk";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { getOperationsClient } from "@/lib/operations";
import { requirePortalAuthentication } from "@/lib/portal-auth";

export default async function OperationsPortalPage() {
  const callbackUrl = "/portal/operations";
  const authentication = await requirePortalAuthentication("staff", callbackUrl);
  const client = await getOperationsClient(authentication.accessToken);
  let suppliers;
  let tasks;

  try {
    [suppliers, tasks] = await Promise.all([
      client.getSuppliers({ pageNumber: 1, pageSize: 6 }),
      client.getTasks({ pageNumber: 1, pageSize: 6 }),
    ]);
  } catch (error) {
    if (error instanceof OperationsApiError && error.status === 401) {
      redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    if (error instanceof OperationsApiError && error.status === 403) {
      redirect("/auth/forbidden");
    }
    throw error;
  }

  return (
    <main className="min-h-[60vh] bg-canvas px-5 py-16" id="main-content">
      <section className="mx-auto max-w-6xl">
        <p className="eyebrow">Staff-authorized foundation</p>
        <h1 className="mt-3 text-5xl text-navy">Operations workspace</h1>
        <p className="mt-5 max-w-3xl text-lg text-ink-muted">
          Supplier directory and booking-operation coordination are protected staff capabilities.
          This workspace never exposes administration, supplier self-service, Directus, live
          availability, payment capture, or customer credentials.
        </p>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="suppliers-heading">
            <h2 className="text-3xl text-navy" id="suppliers-heading">
              Suppliers
            </h2>
            {suppliers.items.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  description="No supplier records have been created."
                  title="No suppliers yet."
                />
              </div>
            ) : (
              <ul className="mt-4 grid gap-3">
                {suppliers.items.map((supplier) => (
                  <li
                    className="rounded-2xl border border-navy/10 bg-white p-5 shadow-soft"
                    key={supplier.id}
                  >
                    <h3 className="text-xl text-navy">{supplier.name}</h3>
                    <p className="mt-1 text-sm text-ink-muted">{supplier.category}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="tasks-heading">
            <h2 className="text-3xl text-navy" id="tasks-heading">
              Booking operations
            </h2>
            {tasks.items.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  description="No booking-operation tasks need attention."
                  title="No tasks yet."
                />
              </div>
            ) : (
              <ul className="mt-4 grid gap-3">
                {tasks.items.map((task) => (
                  <li
                    className="rounded-2xl border border-navy/10 bg-white p-5 shadow-soft"
                    key={task.id}
                  >
                    <h3 className="text-xl text-navy">{task.title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      {task.status} · booking {task.bookingId}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
