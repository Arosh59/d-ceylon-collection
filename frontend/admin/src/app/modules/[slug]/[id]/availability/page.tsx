import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { AvailabilityEditor } from "@/components/availability-editor";
import { getAdminAvailability } from "@/lib/admin-availability";
import { managedResource } from "@/lib/admin-content";
import { requireAdministrator } from "@/lib/auth";

export default async function ProductAvailabilityPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  if (managedResource(slug)?.resource !== "products") notFound();
  const returnTo = `/modules/${slug}/${id}/availability`;
  const session = await requireAdministrator(returnTo);
  const availability = await getAdminAvailability(session.accessToken, id);
  if (!["experience", "accommodation", "stay"].includes(availability.product.productType.slug)) {
    notFound();
  }

  return (
    <AdminShell
      currentModule={slug}
      description="Configure bookable details, sellable dates, capacity, and server-owned prices."
      eyebrow="Commercial inventory"
      title={`${availability.product.name} availability`}
      user={session.user}
    >
      <AvailabilityEditor availability={availability} moduleSlug={slug} />
    </AdminShell>
  );
}
