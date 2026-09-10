import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ContentEditor } from "@/components/content-editor";
import {
  getAdminContentOptions,
  getAdminContentRecord,
  managedResource,
} from "@/lib/admin-content";
import { ADMIN_MODULES } from "@/lib/admin-modules";
import { requireAdministrator } from "@/lib/auth";

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const managed = managedResource(slug);
  if (!ADMIN_MODULES.some((item) => item.slug === slug) || !managed) notFound();
  const session = await requireAdministrator(`/modules/${slug}/${id}`);
  const [record, options] = await Promise.all([
    getAdminContentRecord(session.accessToken, managed.resource, id),
    getAdminContentOptions(session.accessToken),
  ]);
  return (
    <AdminShell
      currentModule={slug}
      description="Update content, relationships, and publication state."
      eyebrow="Content editor"
      title={`Edit ${record.name}`}
      user={session.user}
    >
      <section className="records-panel p-5">
        {managed.resource === "products" ? (
          <div className="availability-callout">
            <div>
              <strong>Availability and booking details</strong>
              <p>Manage slots, room types, nightly inventory, capacity, pricing, and policies.</p>
            </div>
            <Link className="secondary-button" href={`/modules/${slug}/${id}/availability`}>
              Manage availability
            </Link>
          </div>
        ) : null}
        <ContentEditor
          moduleSlug={slug}
          options={options}
          productType={managed.productType}
          record={record}
          resource={managed.resource}
        />
      </section>
    </AdminShell>
  );
}
