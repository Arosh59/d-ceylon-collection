import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { page, pagination, type PageQuery } from "../../common/pagination";
import { DatabaseService } from "../../database/database.service";

interface EditorialArticle {
  slug: string;
  title: string;
  summary: string | null;
  content?: string | null;
  heroImage: string | null;
  datePublished: Date | null;
}

interface EditorialPromotion {
  id: string;
  title: string;
  summary: string | null;
  callToActionLabel: string | null;
  callToActionUrl: string | null;
  image: string | null;
}

@Injectable()
export class EditorialService {
  public constructor(private readonly database: DatabaseService) {}

  public async journal(query: PageQuery): Promise<Record<string, unknown>> {
    const p = pagination(query);
    const [items, totalItems] = await Promise.all([
      this.database.rows<EditorialArticle>(Prisma.sql`
        SELECT slug, title, summary, hero_image AS "heroImage", date_published AS "datePublished"
          FROM editorial.journal_articles
         WHERE status = 'published'
         ORDER BY date_published DESC NULLS LAST, slug
         OFFSET ${p.skip} LIMIT ${p.pageSize}
      `),
      this.database.rows<{ count: bigint }>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
          FROM editorial.journal_articles
         WHERE status = 'published'
      `),
    ]);
    return page(items.map(summary), Number(totalItems[0]?.count ?? 0), p.pageNumber, p.pageSize);
  }

  public async article(slug: string): Promise<Record<string, unknown>> {
    if (!slug.trim()) throw new NotFoundException();
    const items = await this.database.rows<EditorialArticle>(Prisma.sql`
      SELECT slug, title, summary, content, hero_image AS "heroImage", date_published AS "datePublished"
        FROM editorial.journal_articles
       WHERE status = 'published' AND slug = ${slug}
       LIMIT 1
    `);
    const item = items[0];
    if (!item) throw new NotFoundException();
    return { ...summary(item), content: item.content ?? "" };
  }

  public async promotions(): Promise<Record<string, unknown>[]> {
    const items = await this.database.rows<EditorialPromotion>(Prisma.sql`
      SELECT id, title, summary, cta_label AS "callToActionLabel",
             cta_url AS "callToActionUrl", image
        FROM editorial.promotions
       WHERE status = 'published'
       ORDER BY sort, id
       LIMIT 20
    `);
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary ?? null,
      callToActionLabel: item.callToActionLabel ?? null,
      callToActionUrl: item.callToActionUrl ?? null,
      imageUrl: item.image ?? null,
    }));
  }
}

function summary(item: EditorialArticle): Record<string, unknown> {
  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary ?? null,
    heroImageUrl: item.heroImage ?? null,
    publishedAtUtc: item.datePublished?.toISOString() ?? null,
  };
}
