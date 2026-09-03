import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";

import { page, pagination, type PageQuery } from "../../common/pagination";

interface DirectusList<T> {
  data: T[];
  meta?: { filter_count?: number };
}

interface DirectusArticle {
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  hero_image?: string | null;
  date_published?: string | null;
}

interface DirectusPromotion {
  id: string;
  title: string;
  summary?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  image?: string | null;
}

@Injectable()
export class EditorialService {
  public async journal(query: PageQuery): Promise<Record<string, unknown>> {
    const p = pagination(query);
    const result = await this.get<DirectusList<DirectusArticle>>(
      `items/journal_articles?filter[status][_eq]=published&sort=-date_published&limit=${p.pageSize}&offset=${p.skip}&meta=filter_count&fields=slug,title,summary,hero_image,date_published`,
    );
    return page(
      result.data.map(summary),
      result.meta?.filter_count ?? result.data.length,
      p.pageNumber,
      p.pageSize,
    );
  }

  public async article(slug: string): Promise<Record<string, unknown>> {
    if (!slug.trim()) throw new NotFoundException();
    const result = await this.get<DirectusList<DirectusArticle>>(
      `items/journal_articles?filter[status][_eq]=published&filter[slug][_eq]=${encodeURIComponent(slug)}&limit=1&fields=slug,title,summary,content,hero_image,date_published`,
    );
    const item = result.data[0];
    if (!item) throw new NotFoundException();
    return { ...summary(item), content: item.content ?? "" };
  }

  public async promotions(): Promise<Record<string, unknown>[]> {
    const result = await this.get<DirectusList<DirectusPromotion>>(
      "items/promotions?filter[status][_eq]=published&sort=sort&limit=20&fields=id,title,summary,cta_label,cta_url,image",
    );
    return result.data.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary ?? null,
      callToActionLabel: item.cta_label ?? null,
      callToActionUrl: item.cta_url ?? null,
      imageUrl: item.image ?? null,
    }));
  }

  private async get<T>(path: string): Promise<T> {
    const baseUrl = process.env.DIRECTUS_API_BASE_URL?.trim();
    if (!baseUrl) {
      throw new ServiceUnavailableException(
        "Editorial content is not configured for this environment.",
      );
    }
    const response = await fetch(new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`), {
      headers: process.env.DIRECTUS_STATIC_TOKEN
        ? { Authorization: `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}` }
        : undefined,
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException("Editorial content is temporarily unavailable.");
    }
    return (await response.json()) as T;
  }
}

function summary(item: DirectusArticle): Record<string, unknown> {
  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary ?? null,
    heroImageUrl: item.hero_image ?? null,
    publishedAtUtc: item.date_published ?? null,
  };
}
