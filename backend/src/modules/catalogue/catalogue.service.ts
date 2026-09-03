import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { page, pagination, type PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { apiValue } from "../../common/serialization";
import { DatabaseService } from "../../database/database.service";

export interface ProductSearchQuery extends PageQuery {
  query?: string;
  productType?: string;
  category?: string;
  collection?: string;
  destination?: string;
  tag?: string;
  minimumPrice?: string | number;
  maximumPrice?: string | number;
  minimumDurationMinutes?: string | number;
  maximumDurationMinutes?: string | number;
  sort?: string;
}

type NamedTable = "categories" | "product_types" | "tags";
type PublishedTable = "collections" | "destinations";

@Injectable()
export class CatalogueService {
  public constructor(private readonly database: DatabaseService) {}

  public async products(query: ProductSearchQuery): Promise<Record<string, unknown>> {
    const p = pagination({ ...query, pageSize: query.pageSize ?? 12 });
    validateSearch(query);
    const conditions: Prisma.Sql[] = [Prisma.sql`p.publication_state = 'Published'`];
    if (normalize(query.query)) {
      conditions.push(
        Prisma.sql`p.search_vector @@ plainto_tsquery('english', ${normalize(query.query)!})`,
      );
    }
    if (normalize(query.productType)) {
      conditions.push(Prisma.sql`pt.slug = ${normalize(query.productType)!}`);
    }
    this.relationFilter(conditions, "product_categories", "categories", query.category);
    this.relationFilter(conditions, "product_collections", "collections", query.collection);
    this.relationFilter(conditions, "product_destinations", "destinations", query.destination);
    this.relationFilter(conditions, "product_tags", "tags", query.tag);
    if (query.minimumPrice !== undefined)
      conditions.push(Prisma.sql`p.starting_price >= ${Number(query.minimumPrice)}`);
    if (query.maximumPrice !== undefined)
      conditions.push(Prisma.sql`p.starting_price <= ${Number(query.maximumPrice)}`);
    if (query.minimumDurationMinutes !== undefined)
      conditions.push(Prisma.sql`p.duration_minutes >= ${Number(query.minimumDurationMinutes)}`);
    if (query.maximumDurationMinutes !== undefined)
      conditions.push(Prisma.sql`p.duration_minutes <= ${Number(query.maximumDurationMinutes)}`);
    const where = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
    const order =
      query.sort === "price-asc"
        ? Prisma.sql`p.starting_price IS NULL, p.starting_price, p.name, p.id`
        : query.sort === "price-desc"
          ? Prisma.sql`p.starting_price IS NULL, p.starting_price DESC, p.name, p.id`
          : query.sort === "duration-asc"
            ? Prisma.sql`p.duration_minutes IS NULL, p.duration_minutes, p.name, p.id`
            : Prisma.sql`p.name, p.id`;
    const [counts, items] = await Promise.all([
      this.database.rows<{ count: bigint }>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM catalogue.products p
        JOIN catalogue.product_types pt ON pt.id = p.product_type_id
        ${where}
      `),
      this.database.rows<Record<string, unknown>>(Prisma.sql`
        SELECT p.id, p.name, p.slug,
               p.short_description AS "shortDescription",
               json_build_object('id', pt.id, 'name', pt.name, 'slug', pt.slug) AS "productType",
               p.starting_price AS "startingPrice", p.currency,
               p.duration_minutes AS "durationMinutes",
               (SELECT json_build_object('id', m.id, 'assetKey', m.asset_key,
                                         'altText', m.alt_text, 'width', m.width, 'height', m.height)
                  FROM catalogue.product_media pm
                  JOIN catalogue.media_assets m ON m.id = pm.media_asset_id
                 WHERE pm.product_id = p.id
                 ORDER BY pm.sort_order, pm.media_asset_id LIMIT 1) AS "primaryMedia",
               COALESCE((SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) ORDER BY c.name)
                           FROM catalogue.product_collections pc
                           JOIN catalogue.collections c ON c.id = pc.collection_id
                          WHERE pc.product_id = p.id AND c.publication_state = 'Published'), '[]') AS collections,
               COALESCE((SELECT json_agg(json_build_object('id', d.id, 'name', d.name, 'slug', d.slug) ORDER BY d.name)
                           FROM catalogue.product_destinations pd
                           JOIN catalogue.destinations d ON d.id = pd.destination_id
                          WHERE pd.product_id = p.id AND d.publication_state = 'Published'), '[]') AS destinations
          FROM catalogue.products p
          JOIN catalogue.product_types pt ON pt.id = p.product_type_id
          ${where}
         ORDER BY ${order}
         OFFSET ${p.skip} LIMIT ${p.pageSize}
      `),
    ]);
    return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }

  public async product(slug: string): Promise<Record<string, unknown>> {
    validateSlug(slug);
    const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      SELECT p.id, p.name, p.slug, p.short_description AS "shortDescription", p.description,
             json_build_object('id', pt.id, 'name', pt.name, 'slug', pt.slug) AS "productType",
             p.starting_price AS "startingPrice", p.currency, p.duration_minutes AS "durationMinutes",
             COALESCE((SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) ORDER BY c.name)
                         FROM catalogue.product_categories pc JOIN catalogue.categories c ON c.id = pc.category_id
                        WHERE pc.product_id = p.id), '[]') AS categories,
             COALESCE((SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) ORDER BY c.name)
                         FROM catalogue.product_collections pc JOIN catalogue.collections c ON c.id = pc.collection_id
                        WHERE pc.product_id = p.id), '[]') AS collections,
             COALESCE((SELECT json_agg(json_build_object('id', d.id, 'name', d.name, 'slug', d.slug) ORDER BY d.name)
                         FROM catalogue.product_destinations pd JOIN catalogue.destinations d ON d.id = pd.destination_id
                        WHERE pd.product_id = p.id), '[]') AS destinations,
             COALESCE((SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug) ORDER BY t.name)
                         FROM catalogue.product_tags px JOIN catalogue.tags t ON t.id = px.tag_id
                        WHERE px.product_id = p.id), '[]') AS tags,
             COALESCE((SELECT json_agg(json_build_object('id', m.id, 'assetKey', m.asset_key,
                                                        'altText', m.alt_text, 'width', m.width, 'height', m.height)
                                       ORDER BY pm.sort_order, pm.media_asset_id)
                         FROM catalogue.product_media pm JOIN catalogue.media_assets m ON m.id = pm.media_asset_id
                        WHERE pm.product_id = p.id), '[]') AS media
        FROM catalogue.products p
        JOIN catalogue.product_types pt ON pt.id = p.product_type_id
       WHERE p.slug = ${slug} AND p.publication_state = 'Published'
       LIMIT 1
    `);
    if (!rows[0])
      throw new DomainError(
        404,
        "No published product matched the supplied slug.",
        "Product not found",
      );
    return apiValue(rows[0]);
  }

  public async namedPage(table: NamedTable, query: PageQuery): Promise<Record<string, unknown>> {
    const p = pagination(query);
    const tableName = Prisma.raw(`catalogue.${table}`);
    const [counts, items] = await Promise.all([
      this.database.rows<{ count: bigint }>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM ${tableName}`,
      ),
      this.database.rows<Record<string, unknown>>(Prisma.sql`
        SELECT id, name, slug FROM ${tableName} ORDER BY name, id OFFSET ${p.skip} LIMIT ${p.pageSize}
      `),
    ]);
    return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }

  public async publishedNamedPage(
    table: PublishedTable,
    query: PageQuery,
  ): Promise<Record<string, unknown>> {
    const p = pagination(query);
    const tableName = Prisma.raw(`catalogue.${table}`);
    const [counts, items] = await Promise.all([
      this.database.rows<{ count: bigint }>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count FROM ${tableName} WHERE publication_state = 'Published'
      `),
      this.database.rows<Record<string, unknown>>(Prisma.sql`
        SELECT x.id, x.name, x.slug, COALESCE(x.summary, '') AS summary,
               CASE WHEN m.id IS NULL THEN NULL ELSE json_build_object(
                 'id', m.id, 'assetKey', m.asset_key, 'altText', m.alt_text,
                 'width', m.width, 'height', m.height) END AS "heroMedia"
          FROM ${tableName} x LEFT JOIN catalogue.media_assets m ON m.id = x.hero_media_id
         WHERE x.publication_state = 'Published'
         ORDER BY x.name, x.id OFFSET ${p.skip} LIMIT ${p.pageSize}
      `),
    ]);
    return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }

  public collection(slug: string): Promise<Record<string, unknown>> {
    return this.publishedDetail("collections", "product_collections", "collection_id", slug);
  }

  public destination(slug: string): Promise<Record<string, unknown>> {
    return this.publishedDetail("destinations", "product_destinations", "destination_id", slug);
  }

  public async planning(destinationSlugs: string[]): Promise<Record<string, unknown>[]> {
    if (!destinationSlugs.length) return [];
    return this.database.rows<Record<string, unknown>>(Prisma.sql`
      SELECT p.slug AS "productSlug", p.name, p.duration_minutes AS "durationMinutes",
             ARRAY[pt.slug] AS "productTypeSlugs",
             ARRAY(SELECT c.slug FROM catalogue.product_categories pc JOIN catalogue.categories c ON c.id=pc.category_id WHERE pc.product_id=p.id ORDER BY c.slug) AS "categorySlugs",
             ARRAY(SELECT d.slug FROM catalogue.product_destinations px JOIN catalogue.destinations d ON d.id=px.destination_id WHERE px.product_id=p.id ORDER BY d.slug) AS "destinationSlugs",
             ARRAY(SELECT t.slug FROM catalogue.product_tags px JOIN catalogue.tags t ON t.id=px.tag_id WHERE px.product_id=p.id ORDER BY t.slug) AS "tagSlugs"
        FROM catalogue.products p JOIN catalogue.product_types pt ON pt.id=p.product_type_id
       WHERE p.publication_state='Published' AND EXISTS (
         SELECT 1 FROM catalogue.product_destinations px JOIN catalogue.destinations d ON d.id=px.destination_id
          WHERE px.product_id=p.id AND d.slug IN (${Prisma.join(destinationSlugs)})
       ) ORDER BY p.slug
    `);
  }

  private relationFilter(
    conditions: Prisma.Sql[],
    linkTable: string,
    referenceTable: string,
    value: string | undefined,
  ): void {
    const slug = normalize(value);
    if (!slug) return;
    const foreign = referenceTable.endsWith("ies")
      ? `${referenceTable.slice(0, -3)}y_id`
      : `${referenceTable.slice(0, -1)}_id`;
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM ${Prisma.raw(`catalogue.${linkTable}`)} link
      JOIN ${Prisma.raw(`catalogue.${referenceTable}`)} ref ON ref.id = link.${Prisma.raw(foreign)}
      WHERE link.product_id = p.id AND ref.slug = ${slug}
    )`);
  }

  private async publishedDetail(
    table: PublishedTable,
    linkTable: string,
    foreignColumn: string,
    slug: string,
  ): Promise<Record<string, unknown>> {
    validateSlug(slug);
    const rows = await this.database.rows<Record<string, unknown>>(Prisma.sql`
      SELECT x.id, x.name, x.slug, COALESCE(x.summary, '') AS summary,
             COALESCE(x.description, '') AS description,
             CASE WHEN m.id IS NULL THEN NULL ELSE json_build_object(
               'id', m.id, 'assetKey', m.asset_key, 'altText', m.alt_text,
               'width', m.width, 'height', m.height) END AS "heroMedia",
             (SELECT COUNT(*)::int FROM ${Prisma.raw(`catalogue.${linkTable}`)} link
               JOIN catalogue.products p ON p.id=link.product_id
              WHERE link.${Prisma.raw(foreignColumn)}=x.id AND p.publication_state='Published') AS "publishedProductCount"
        FROM ${Prisma.raw(`catalogue.${table}`)} x
        LEFT JOIN catalogue.media_assets m ON m.id=x.hero_media_id
       WHERE x.slug=${slug} AND x.publication_state='Published' LIMIT 1
    `);
    if (!rows[0]) {
      const title = table === "collections" ? "Collection not found" : "Destination not found";
      throw new DomainError(
        404,
        `No published ${table.slice(0, -1)} matched the supplied slug.`,
        title,
      );
    }
    return apiValue(rows[0]);
  }
}

function normalize(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function validateSlug(value: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)) {
    throw new DomainError(400, "Slug format is invalid.", "Validation failed", {
      slug: ["Slug format is invalid."],
    });
  }
}

function validateSearch(query: ProductSearchQuery): void {
  if (
    query.query !== undefined &&
    (query.query.trim().length < 2 || query.query.trim().length > 100)
  ) {
    throw new DomainError(
      400,
      "Query must contain between 2 and 100 characters.",
      "Validation failed",
    );
  }
  for (const key of ["productType", "category", "collection", "destination", "tag"] as const) {
    if (query[key]) validateSlug(query[key]!);
  }
  const minPrice = query.minimumPrice === undefined ? undefined : Number(query.minimumPrice);
  const maxPrice = query.maximumPrice === undefined ? undefined : Number(query.maximumPrice);
  const minDuration =
    query.minimumDurationMinutes === undefined ? undefined : Number(query.minimumDurationMinutes);
  const maxDuration =
    query.maximumDurationMinutes === undefined ? undefined : Number(query.maximumDurationMinutes);
  if (
    [minPrice, maxPrice, minDuration, maxDuration].some(
      (value) => value !== undefined && !Number.isFinite(value),
    )
  ) {
    throw new DomainError(400, "Numeric filters are invalid.", "Validation failed");
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new DomainError(400, "Minimum price cannot exceed maximum price.", "Validation failed");
  }
  if (minDuration !== undefined && maxDuration !== undefined && minDuration > maxDuration) {
    throw new DomainError(
      400,
      "Minimum duration cannot exceed maximum duration.",
      "Validation failed",
    );
  }
  if (query.sort && !["name", "price-asc", "price-desc", "duration-asc"].includes(query.sort)) {
    throw new DomainError(400, "Sort value is invalid.", "Validation failed");
  }
}
