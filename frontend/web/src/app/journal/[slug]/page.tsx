import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { EditorialApiError } from "@dceylon/sdk";
import { EmptyState } from "@/components/ui/empty-state";
import { getEditorialClient } from "@/lib/editorial";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Travel Journal" };

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const client = await getEditorialClient();
  let article;
  let unavailable = false;

  try {
    article = await client.getJournalArticle((await params).slug);
  } catch (error) {
    if (!(error instanceof EditorialApiError) || error.status !== 503) throw error;
    unavailable = true;
  }

  if (unavailable) {
    return (
      <main id="main-content">
        <article className="mx-auto max-w-3xl px-5 py-28 sm:py-36">
          <EmptyState
            description="This editorial story is temporarily unavailable."
            title="The journal is taking a brief pause."
          />
        </article>
      </main>
    );
  }

  if (!article) notFound();
  const heroImage = article.heroImageUrl?.startsWith("/images/") ? article.heroImageUrl : null;

  return (
    <main id="main-content">
      <article className="mx-auto max-w-3xl px-5 py-28 sm:py-36">
        <>
          <p className="eyebrow">{article.publishedAtUtc?.slice(0, 10) ?? "Travel Journal"}</p>
          <h1 className="mt-4 text-5xl text-navy sm:text-7xl">{article.title}</h1>
          {article.summary ? (
            <p className="mt-6 text-xl text-ink-muted">{article.summary}</p>
          ) : null}
          {heroImage ? (
            <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-3xl bg-mist shadow-soft">
              <Image
                alt={`View from ${article.title}`}
                className="object-cover"
                fill
                priority
                sizes="(min-width: 768px) 48rem, 100vw"
                src={heroImage}
              />
            </div>
          ) : null}
          <div className="mt-10 whitespace-pre-wrap leading-8 text-ink-muted">
            {article.content}
          </div>
        </>
      </article>
    </main>
  );
}
