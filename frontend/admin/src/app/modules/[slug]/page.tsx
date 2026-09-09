import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { ContactEditor } from "@/components/contact-editor";
import { UserAccessTable } from "@/components/user-access-table";
import {
  getAdminContact,
  getAdminContentPage,
  getAdminUsers,
  managedResource,
  publicWebUrl,
} from "@/lib/admin-content";
import { ADMIN_MODULES } from "@/lib/admin-modules";
import { requireAdministrator } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdministrationModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const session = await requireAdministrator(`/modules/${slug}`);
  const adminModule = ADMIN_MODULES.find((item) => item.slug === slug);
  if (!adminModule) notFound();
  const values = await searchParams;
  const search = first(values.q);
  const status = first(values.status);
  const page = positiveInteger(first(values.page));

  if (slug === "contact") {
    const contact = await getAdminContact(session.accessToken);
    return (
      <AdminShell
        currentModule={slug}
        description={adminModule.description}
        eyebrow="Website content"
        title={adminModule.name}
        user={session.user}
      >
        <div className="breadcrumb-row">
          <Breadcrumb name={adminModule.name} />
          <Preview href="/contact" />
        </div>
        <section className="records-panel p-5" aria-labelledby="contact-editor-heading">
          <h2 className="section-heading" id="contact-editor-heading">
            Contact-page content
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            These details appear on the public contact page.
          </p>
          <ContactEditor contact={contact} />
        </section>
      </AdminShell>
    );
  }

  if (slug === "users") {
    const users = await getAdminUsers(session.accessToken, page, search);
    return (
      <AdminShell
        currentModule={slug}
        description={adminModule.description}
        eyebrow="Security and access"
        title={adminModule.name}
        user={session.user}
      >
        <div className="breadcrumb-row">
          <Breadcrumb name={adminModule.name} />
          <span className="record-count">{users.pagination.totalItems} accounts</span>
        </div>
        <section className="records-panel" aria-labelledby="users-heading">
          <RecordsHeader
            addHref={null}
            heading="User access"
            headingId="users-heading"
            search={search}
          />
          {users.items.length ? <UserAccessTable users={users.items} /> : <Empty />}
          <Pagination
            moduleSlug={slug}
            page={users.pagination.pageNumber}
            totalPages={users.pagination.totalPages}
            search={search}
          />
        </section>
      </AdminShell>
    );
  }

  const managed = managedResource(slug);
  if (!managed) {
    return (
      <AdminShell
        currentModule={slug}
        description={adminModule.description}
        eyebrow="Records and workflows"
        title={adminModule.name}
        user={session.user}
      >
        <section className="protected-panel" aria-labelledby="module-status-heading">
          <span className="status-icon status-icon-warning" aria-hidden="true">
            !
          </span>
          <div>
            <p className="eyebrow">Managed access</p>
            <h2 className="section-heading" id="module-status-heading">
              Workflow integration pending
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-700">
              This operational module remains protected while its write workflow is completed.
              Catalogue and editorial management are available from the Content navigation.
            </p>
          </div>
        </section>
      </AdminShell>
    );
  }

  const data = await getAdminContentPage(session.accessToken, managed.resource, {
    page,
    search,
    status,
    productType: managed.productType,
  });
  return (
    <AdminShell
      currentModule={slug}
      description={adminModule.description}
      eyebrow="Website content"
      title={adminModule.name}
      user={session.user}
    >
      <div className="breadcrumb-row">
        <Breadcrumb name={adminModule.name} />
        <span className="record-count">
          {data.pagination.totalItems.toLocaleString("en-LK")} records
        </span>
      </div>
      {values.saved ? <Notice>Record saved successfully.</Notice> : null}
      {values.archived ? (
        <Notice>Record archived and removed from the public website.</Notice>
      ) : null}
      {values.deleted ? <Notice>Reference record deleted successfully.</Notice> : null}
      <section className="records-panel" aria-labelledby="records-heading">
        <RecordsHeader
          addHref={`/modules/${slug}/new`}
          heading="Managed records"
          search={search}
          status={status}
        />
        {data.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-canvas text-xs tracking-[0.12em] text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/8">
                {data.items.map((item) => (
                  <tr className="hover:bg-canvas/70" key={item.id}>
                    <td className="px-5 py-4">
                      <strong className="block">{item.name}</strong>
                      <small className="text-slate-500">/{item.slug}</small>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.typeName ?? adminModule.name}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`publication-badge publication-${item.publicationState.toLowerCase()}`}
                      >
                        {item.publicationState}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(item.updatedAtUtc).toLocaleDateString("en-LK")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link className="table-action" href={`/modules/${slug}/${item.id}`}>
                        Edit
                      </Link>
                      {publicPath(managed.resource, item.slug) ? (
                        <>
                          {" "}
                          <a
                            className="table-action"
                            href={publicWebUrl(publicPath(managed.resource, item.slug)!)}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Preview
                          </a>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        <Pagination
          moduleSlug={slug}
          page={data.pagination.pageNumber}
          totalPages={data.pagination.totalPages}
          search={search}
          status={status}
        />
      </section>
    </AdminShell>
  );
}

function RecordsHeader({
  addHref,
  heading,
  headingId = "records-heading",
  search,
  status,
}: {
  addHref: string | null;
  heading: string;
  headingId?: string;
  search?: string;
  status?: string;
}) {
  return (
    <div className="records-header">
      <h2 className="text-2xl font-serif" id={headingId}>
        {heading}
      </h2>
      <form className="records-filters" method="get">
        <label className="sr-only" htmlFor="record-search">
          Search records
        </label>
        <input
          defaultValue={search}
          id="record-search"
          name="q"
          placeholder="Search records"
          type="search"
        />
        {status !== undefined ? (
          <select aria-label="Publication status" defaultValue={status ?? ""} name="status">
            <option value="">All states</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
        ) : null}
        <button className="secondary-button" type="submit">
          Filter
        </button>
        {addHref ? (
          <Link className="primary-button" href={addHref}>
            Add record
          </Link>
        ) : null}
      </form>
    </div>
  );
}
function Pagination({
  moduleSlug,
  page,
  totalPages,
  search,
  status,
}: {
  moduleSlug: string;
  page: number;
  totalPages: number;
  search?: string;
  status?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination-row">
      <span>
        Page {page} of {totalPages}
      </span>
      <div>
        {page > 1 ? (
          <Link className="secondary-button" href={pageHref(moduleSlug, page - 1, search, status)}>
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link className="secondary-button" href={pageHref(moduleSlug, page + 1, search, status)}>
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
function Breadcrumb({ name }: { name: string }) {
  return (
    <p className="text-sm text-slate-500">
      <Link className="font-semibold text-navy hover:text-gold" href="/">
        Overview
      </Link>
      <span aria-hidden="true"> / </span>
      {name}
    </p>
  );
}
function Preview({ href }: { href: string }) {
  return (
    <a className="secondary-button" href={publicWebUrl(href)} rel="noreferrer" target="_blank">
      Open public page
    </a>
  );
}
function Empty() {
  return <p className="p-10 text-center text-slate-600">No records matched this view.</p>;
}
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="form-success mb-5" role="status">
      {children}
    </p>
  );
}
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
function positiveInteger(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}
function pageHref(slug: string, page: number, search?: string, status?: string) {
  const query = new URLSearchParams({ page: String(page) });
  if (search) query.set("q", search);
  if (status) query.set("status", status);
  return `/modules/${slug}?${query}`;
}
function publicPath(resource: string, slug: string): string | null {
  return resource === "journal"
    ? `/journal/${slug}`
    : resource === "collections"
      ? `/collections/${slug}`
      : resource === "destinations"
        ? `/destinations/${slug}`
        : resource === "products"
          ? `/catalogue/${slug}`
          : null;
}
