import { notFound } from "next/navigation";

import { ADMIN_MODULES } from "@/lib/admin-modules";
import { requireAdministrator } from "@/lib/auth";

export default async function AdministrationModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdministrator();
  const { slug } = await params;
  const adminModule = ADMIN_MODULES.find((item) => item.slug === slug);
  if (!adminModule) notFound();
  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-10">
      <p className="text-sm font-bold tracking-[0.16em] text-gold uppercase">
        Administrative module
      </p>
      <h1 className="mt-3 text-5xl font-serif">{adminModule.name}</h1>
      <p className="mt-6 max-w-2xl leading-7 text-slate-600">
        {adminModule.description} This protected route is a foundation only; it does not bypass API
        authorization or create unreviewed administrative write paths.
      </p>
    </main>
  );
}
