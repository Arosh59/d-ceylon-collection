import { notFound } from "next/navigation";
import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { getCatalogueModuleData, type CatalogueModule } from "@/lib/catalogue-data";
import { ADMIN_MODULES } from "@/lib/admin-modules";
import { requireAdministrator } from "@/lib/auth";
import { getAdminAuthenticationEnvironment } from "@/lib/auth-environment";

export default async function AdministrationModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
    sort?: string | string[];
  }>;
}) {
  const session = await requireAdministrator();
  const environment = getAdminAuthenticationEnvironment();
  const { slug } = await params;
  const adminModule = ADMIN_MODULES.find((item) => item.slug === slug);
  if (!adminModule) notFound();

  const catalogueResources = new Set<CatalogueModule>([
    "products",
    "product-types",
    "categories",
    "collections",
    "destinations",
    "tags",
  ]);
  const queryValue = (await searchParams).q;
  const query = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  const pageValue = (await searchParams).page;
  const parsedPage = Number(Array.isArray(pageValue) ? pageValue[0] : pageValue);
  const pageNumber = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sortValue = (await searchParams).sort;
  const sort = Array.isArray(sortValue) ? sortValue[0] : sortValue;
  const data = catalogueResources.has(slug as CatalogueModule)
    ? await getCatalogueModuleData(slug as CatalogueModule, query, pageNumber, sort)
    : null;

  return (
    <AdminShell
      authenticationMode={environment.authenticationMode}
      currentModule={slug}
      description={adminModule.description}
      eyebrow="Records and workflows"
      title={adminModule.name}
      user={session.user}
    >
      <div className="breadcrumb-row">
        <p className="text-sm text-slate-500">
          <Link className="font-semibold text-navy hover:text-gold" href="/">
            Overview
          </Link>
          <span aria-hidden="true"> / </span>
          {adminModule.name}
        </p>
        {data ? (
          <p className="record-count">{data.totalItems.toLocaleString("en-LK")} records</p>
        ) : null}
      </div>

      {data ? (
        <section className="records-panel" aria-labelledby="records-heading">
          <div className="flex flex-col gap-4 border-b border-navy/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-serif" id="records-heading">
              Published records
            </h2>
            <form className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap" method="get">
              <label className="sr-only" htmlFor="record-search">
                Search records
              </label>
              <input
                className="min-w-0 flex-1 rounded-xl border border-navy/15 px-4 py-2 text-sm sm:w-64"
                defaultValue={query}
                id="record-search"
                name="q"
                placeholder="Search products"
                type="search"
              />
              {slug === "products" ? (
                <label className="sr-only" htmlFor="record-sort">
                  Sort records
                </label>
              ) : null}
              {slug === "products" ? (
                <select
                  className="rounded-xl border border-navy/15 px-3 py-2 text-sm"
                  defaultValue={sort ?? "name"}
                  id="record-sort"
                  name="sort"
                >
                  <option value="name">Name</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="duration-asc">Duration</option>
                </select>
              ) : null}
              <button
                className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/85"
                type="submit"
              >
                Search
              </button>
            </form>
          </div>
          {data.items.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] text-left text-sm">
                <thead className="bg-canvas text-xs tracking-[0.12em] text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Slug</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Record ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/8">
                  {data.items.map((item) => (
                    <tr className="hover:bg-canvas/70" key={item.id}>
                      <td className="px-5 py-4 font-semibold">{item.name}</td>
                      <td className="px-5 py-4 text-slate-600">{item.slug}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {item.productType?.name ?? adminModule.name}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{item.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-8 text-center text-slate-600">No records matched this search.</p>
          )}
          <div className="flex items-center justify-between gap-4 border-t border-navy/10 px-5 py-4 text-sm text-slate-500">
            <span>
              Page {data.pageNumber} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              {data.pageNumber > 1 ? (
                <Link
                  className="rounded-lg border border-navy/15 px-3 py-2 hover:border-gold"
                  href={modulePageHref(slug, query, data.pageNumber - 1, sort)}
                >
                  Previous
                </Link>
              ) : null}
              {data.pageNumber < data.totalPages ? (
                <Link
                  className="rounded-lg border border-navy/15 px-3 py-2 hover:border-gold"
                  href={modulePageHref(slug, query, data.pageNumber + 1, sort)}
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <section className="protected-panel" aria-labelledby="module-status-heading">
          <span className="status-icon status-icon-warning" aria-hidden="true">
            !
          </span>
          <div>
            <p className="eyebrow">Managed access</p>
            <h2 className="section-heading" id="module-status-heading">
              Protected workflow
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-700">
              This workflow is available only to a managed administrator session with an API access
              token. Local development credentials intentionally provide catalogue review without
              bypassing protected operational data.
            </p>
          </div>
        </section>
      )}
    </AdminShell>
  );
}

function modulePageHref(
  slug: string,
  query: string | undefined,
  page: number,
  sort: string | undefined,
): string {
  const params = new URLSearchParams({ page: String(page) });
  if (query) params.set("q", query);
  if (slug === "products" && sort) params.set("sort", sort);
  return `/modules/${slug}?${params.toString()}`;
}
