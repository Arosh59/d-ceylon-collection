import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { EditorialApiError } from "@dceylon/sdk";
import { getEditorialClient } from "@/lib/editorial";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Travel Journal",
  description: "Stories, perspectives, and considered journeys across Sri Lanka.",
};

export default async function JournalPage() {
  const client = await getEditorialClient();
  let page;
  let unavailable = false;

  try {
    page = await client.getJournal({ pageNumber: 1, pageSize: 24 });
  } catch (error) {
    if (!(error instanceof EditorialApiError) || error.status !== 503) throw error;
    unavailable = true;
  }

  if (unavailable) {
    return <JournalUnavailable />;
  }

  if (!page) throw new Error("The journal page was not loaded.");

  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
          <p className="eyebrow text-gold-light">Travel Journal</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">
            Stories that deepen the journey.
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        {page.items.length === 0 ? (
          <EmptyState
            description="Published stories will appear here when they are ready."
            title="No journal articles are currently published."
          />
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {page.items.map((article) => (
              <li
                className="rounded-3xl border border-navy/10 bg-white p-7 shadow-soft"
                key={article.slug}
              >
                <p className="eyebrow">{article.publishedAtUtc?.slice(0, 10) ?? "Journal"}</p>
                <h2 className="mt-3 text-3xl text-navy">{article.title}</h2>
                {article.summary ? <p className="mt-3 text-ink-muted">{article.summary}</p> : null}
                <Link
                  className="mt-6 inline-block font-semibold text-navy underline decoration-gold"
                  href={`/journal/${article.slug}`}
                >
                  Read story
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function JournalUnavailable() {
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
          <p className="eyebrow text-gold-light">Travel Journal</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">
            Stories that deepen the journey.
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <EmptyState
          description="Editorial stories are being prepared. Please return soon."
          title="The journal is taking a brief pause."
        />
      </section>
    </main>
  );
}
