import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ContentEditor } from "@/components/content-editor";
import { getAdminContentOptions, managedResource } from "@/lib/admin-content";
import { ADMIN_MODULES } from "@/lib/admin-modules";
import { requireAdministrator } from "@/lib/auth";

export default async function NewContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const adminModule = ADMIN_MODULES.find((item) => item.slug === slug);
  const managed = managedResource(slug);
  if (!adminModule || !managed) notFound();
  const session = await requireAdministrator(`/modules/${slug}/new`);
  const options = await getAdminContentOptions(session.accessToken);
  return (
    <AdminShell
      currentModule={slug}
      description={`Create and publish a new ${adminModule.name.toLowerCase()} record.`}
      eyebrow="Content editor"
      title={`Add ${adminModule.name}`}
      user={session.user}
    >
      <section className="records-panel p-5">
        <ContentEditor
          moduleSlug={slug}
          options={options}
          productType={managed.productType}
          resource={managed.resource}
        />
      </section>
    </AdminShell>
  );
}
