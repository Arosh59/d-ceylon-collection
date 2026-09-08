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
  let vehicles;
  let drivers;
  let guides;
  let arrivals;
  let assignments;

  try {
    [suppliers, tasks, vehicles, drivers, guides, arrivals, assignments] = await Promise.all([
      client.getSuppliers({ pageNumber: 1, pageSize: 6 }),
      client.getTasks({ pageNumber: 1, pageSize: 6 }),
      client.getVehicles({ pageNumber: 1, pageSize: 6 }),
      client.getDrivers({ pageNumber: 1, pageSize: 6 }),
      client.getGuides({ pageNumber: 1, pageSize: 6 }),
      client.getArrivals({ pageNumber: 1, pageSize: 6 }),
      client.getAssignments({ pageNumber: 1, pageSize: 6 }),
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
          This workspace never exposes administration, supplier self-service, live availability,
          payment capture, or customer credentials.
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
          <OperationsSummary
            description="Registered transport resources available for future assignment."
            items={vehicles.items}
            title="Vehicles"
          />
          <OperationsSummary
            description="Registered drivers available for future assignment."
            items={drivers.items}
            title="Drivers"
          />
          <OperationsSummary
            description="Registered guides available for future assignment."
            items={guides.items}
            title="Guides"
          />
          <OperationsSummary
            description="Expected booking arrivals requiring operations attention."
            items={arrivals.items}
            title="Arrivals"
          />
          <OperationsSummary
            description="Planned booking vehicle, driver, and guide allocations."
            items={assignments.items}
            title="Assignments"
          />
        </div>
      </section>
    </main>
  );
}

function OperationsSummary({
  description,
  items,
  title,
}: {
  description: string;
  items: Array<{ id: string; name?: string | null; status: string }>;
  title: string;
}) {
  return (
    <section aria-labelledby={`${title.toLowerCase()}-heading`}>
      <h2 className="text-3xl text-navy" id={`${title.toLowerCase()}-heading`}>
        {title}
      </h2>
      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState description={description} title={`No ${title.toLowerCase()} yet.`} />
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-navy/10 bg-white p-5 text-ink-muted shadow-soft">
          {items.length} {title.toLowerCase()} record{items.length === 1 ? "" : "s"} available.
        </p>
      )}
    </section>
  );
}
