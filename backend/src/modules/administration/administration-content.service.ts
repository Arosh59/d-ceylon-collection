import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { page, pagination, requireUuid, type PageQuery } from "../../common/pagination";
import { DomainError } from "../../common/problem-details.filter";
import { apiValue } from "../../common/serialization";
import { DatabaseService } from "../../database/database.service";
import { SecurityAuditService } from "../../database/security-audit.service";
import type { AuthenticatedUser } from "../../common/auth.types";
import type {
  AdministrationContactWriteRequest,
  AdministrationContentWriteRequest,
  AdministrationUserUpdateRequest,
} from "./administration-content.dto";

const resources = [
  "products",
  "collections",
  "destinations",
  "journal",
  "product-types",
  "categories",
  "tags",
  "media",
] as const;
type Resource = (typeof resources)[number];
type ContentQuery = PageQuery & { query?: string; status?: string; productType?: string };

@Injectable()
export class AdministrationContentService {
  public constructor(
    private readonly database: DatabaseService,
    private readonly audit: SecurityAuditService,
  ) {}

  public async list(resourceValue: string, query: ContentQuery) {
    const resource = contentResource(resourceValue);
    const p = pagination(query);
    const search = query.query?.trim() || null;
    const status = query.status?.trim() || null;
    const productType = query.productType?.trim() || null;
    if (resource === "products") {
      const where = Prisma.sql`
        WHERE (${search}::text IS NULL OR p.name ILIKE '%' || ${search} || '%' OR p.slug ILIKE '%' || ${search} || '%')
          AND (${status}::text IS NULL OR p.publication_state = ${status})
          AND (${productType}::text IS NULL OR pt.slug = ${productType})`;
      const [items, counts] = await Promise.all([
        this.database.rows<Record<string, unknown>>(Prisma.sql`
          SELECT p.id, p.name, p.slug, p.publication_state AS "publicationState",
                 p.short_description AS "summary", p.updated_at_utc AS "updatedAtUtc",
                 p.concurrency_token AS "concurrencyToken", pt.name AS "typeName", pt.slug AS "typeSlug"
            FROM catalogue.products p
            JOIN catalogue.product_types pt ON pt.id=p.product_type_id
            ${where}
           ORDER BY p.updated_at_utc DESC, p.name
           OFFSET ${p.skip} LIMIT ${p.pageSize}`),
        this.database.rows<{ count: bigint }>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count FROM catalogue.products p
          JOIN catalogue.product_types pt ON pt.id=p.product_type_id ${where}`),
      ]);
      return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
    }
    if (resource === "journal") {
      const where = Prisma.sql`
        WHERE (${search}::text IS NULL OR title ILIKE '%' || ${search} || '%' OR slug ILIKE '%' || ${search} || '%')
          AND (${status}::text IS NULL OR status = ${status})`;
      const [items, counts] = await Promise.all([
        this.database.rows<Record<string, unknown>>(Prisma.sql`
          SELECT id, title AS name, slug, status AS "publicationState", summary,
                 updated_at_utc AS "updatedAtUtc", concurrency_token AS "concurrencyToken"
            FROM editorial.journal_articles ${where}
           ORDER BY updated_at_utc DESC, title OFFSET ${p.skip} LIMIT ${p.pageSize}`),
        this.database.rows<{ count: bigint }>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count FROM editorial.journal_articles ${where}`),
      ]);
      return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
    }
    if (resource === "media") {
      const where = Prisma.sql`
        WHERE (${search}::text IS NULL OR asset_key ILIKE '%' || ${search} || '%' OR alt_text ILIKE '%' || ${search} || '%')`;
      const [items, counts] = await Promise.all([
        this.database.rows<Record<string, unknown>>(Prisma.sql`
          SELECT id, asset_key AS name, asset_key AS slug, 'Active' AS "publicationState",
                 alt_text AS summary, updated_at_utc AS "updatedAtUtc",
                 concurrency_token AS "concurrencyToken"
            FROM catalogue.media_assets ${where}
           ORDER BY updated_at_utc DESC, asset_key OFFSET ${p.skip} LIMIT ${p.pageSize}`),
        this.database.rows<{ count: bigint }>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count FROM catalogue.media_assets ${where}`),
      ]);
      return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
    }
    if (isTaxonomy(resource)) {
      const table = Prisma.raw(`catalogue.${taxonomyTable(resource)}`);
      const where = Prisma.sql`
        WHERE (${search}::text IS NULL OR name ILIKE '%' || ${search} || '%' OR slug ILIKE '%' || ${search} || '%')`;
      const [items, counts] = await Promise.all([
        this.database.rows<Record<string, unknown>>(Prisma.sql`
          SELECT id, name, slug, 'Active' AS "publicationState", updated_at_utc AS "updatedAtUtc",
                 concurrency_token AS "concurrencyToken"
            FROM ${table} ${where}
           ORDER BY updated_at_utc DESC, name OFFSET ${p.skip} LIMIT ${p.pageSize}`),
        this.database.rows<{ count: bigint }>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count FROM ${table} ${where}`),
      ]);
      return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
    }
    const table = Prisma.raw(`catalogue.${resource}`);
    const where = Prisma.sql`
      WHERE (${search}::text IS NULL OR name ILIKE '%' || ${search} || '%' OR slug ILIKE '%' || ${search} || '%')
        AND (${status}::text IS NULL OR publication_state = ${status})`;
    const [items, counts] = await Promise.all([
      this.database.rows<Record<string, unknown>>(Prisma.sql`
        SELECT id, name, slug, publication_state AS "publicationState", summary,
               updated_at_utc AS "updatedAtUtc", concurrency_token AS "concurrencyToken"
          FROM ${table} ${where}
         ORDER BY updated_at_utc DESC, name OFFSET ${p.skip} LIMIT ${p.pageSize}`),
      this.database.rows<{ count: bigint }>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count FROM ${table} ${where}`),
    ]);
    return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }

  public async get(resourceValue: string, idValue: string) {
    const resource = contentResource(resourceValue);
    const id = requireUuid(idValue);
    if (resource === "products") return this.product(id);
    if (resource === "collections") return this.collection(id);
    if (resource === "destinations") return this.destination(id);
    if (resource === "product-types") return this.taxonomyRecord("productType", id);
    if (resource === "categories") return this.taxonomyRecord("category", id);
    if (resource === "tags") return this.taxonomyRecord("tag", id);
    if (resource === "media") {
      const item = await this.database.mediaAsset.findUnique({ where: { id } });
      if (!item) notFound();
      return apiValue({ ...item, name: item.assetKey, slug: item.assetKey });
    }
    const article = await this.database.journalArticle.findUnique({ where: { id } });
    if (!article) notFound();
    return apiValue({ ...article, name: article.title, publicationState: article.status });
  }

  public async create(
    resourceValue: string,
    body: AdministrationContentWriteRequest,
    user: AuthenticatedUser,
    correlationId: string,
  ) {
    const resource = contentResource(resourceValue);
    validateContent(resource, body);
    const id = randomUUID();
    const now = new Date();
    const token = randomUUID();
    if (resource === "products") {
      await this.database.$transaction(async (tx) => {
        const data = productData(id, token, now, body);
        await tx.$executeRaw`
          INSERT INTO catalogue.products
            (id, concurrency_token, created_at_utc, updated_at_utc, name, slug,
             short_description, description, product_type_id, publication_state,
             starting_price, currency, duration_minutes)
          VALUES
            (${data.id}::uuid, ${data.concurrencyToken}::uuid, ${data.createdAtUtc},
             ${data.updatedAtUtc}, ${data.name}, ${data.slug}, ${data.shortDescription},
             ${data.description}, ${data.productTypeId}::uuid, ${data.publicationState},
             ${data.startingPrice ?? null}, ${data.currency}, ${data.durationMinutes ?? null})`;
        await replaceProductRelations(tx, id, body);
      });
    } else if (resource === "collections") {
      await this.database.travelCollectionEntry.create({
        data: namedData(id, token, now, body),
      });
    } else if (resource === "destinations") {
      await this.database.destination.create({
        data: { ...namedData(id, token, now, body), ...destinationData(body) },
      });
    } else if (resource === "journal") {
      await this.database.journalArticle.create({
        data: {
          id,
          title: body.name.trim(),
          slug: body.slug.trim().toLowerCase(),
          summary: clean(body.summary),
          content: clean(body.content),
          heroImage: clean(body.heroImage),
          status: editorialStatus(body.status ?? body.publicationState),
          datePublished: isPublished(body.status ?? body.publicationState) ? now : null,
          createdAtUtc: now,
          updatedAtUtc: now,
          concurrencyToken: token,
        },
      });
    } else if (isTaxonomy(resource)) {
      const data = {
        id,
        name: body.name.trim(),
        slug: body.slug.trim().toLowerCase(),
        createdAtUtc: now,
        updatedAtUtc: now,
        concurrencyToken: token,
      };
      if (resource === "product-types") await this.database.productType.create({ data });
      else if (resource === "categories") await this.database.category.create({ data });
      else await this.database.tag.create({ data });
    } else {
      await this.database.mediaAsset.create({
        data: {
          id,
          assetKey: requiredValue(body.assetKey ?? body.name, "asset key"),
          altText: requiredValue(body.altText, "alternative text"),
          width: positiveDimension(body.width, "width"),
          height: positiveDimension(body.height, "height"),
          createdAtUtc: now,
          updatedAtUtc: now,
          concurrencyToken: token,
        },
      });
    }
    await this.audit.record(`admin-${resource}-created`, "succeeded", user.subject, correlationId);
    return this.get(resource, id);
  }

  public async update(
    resourceValue: string,
    idValue: string,
    body: AdministrationContentWriteRequest,
    user: AuthenticatedUser,
    correlationId: string,
  ) {
    const resource = contentResource(resourceValue);
    const id = requireUuid(idValue);
    validateContent(resource, body);
    if (!body.concurrencyToken) conflict("The record version is required.");
    const nextToken = randomUUID();
    const now = new Date();
    let changed = 0;
    if (resource === "products") {
      await this.database.$transaction(async (tx) => {
        const result = await tx.product.updateMany({
          where: { id, concurrencyToken: body.concurrencyToken },
          data: productUpdateData(nextToken, now, body),
        });
        changed = result.count;
        if (changed === 1) await replaceProductRelations(tx, id, body);
      });
    } else if (resource === "collections") {
      changed = (
        await this.database.travelCollectionEntry.updateMany({
          where: { id, concurrencyToken: body.concurrencyToken },
          data: namedUpdateData(nextToken, now, body),
        })
      ).count;
    } else if (resource === "destinations") {
      changed = (
        await this.database.destination.updateMany({
          where: { id, concurrencyToken: body.concurrencyToken },
          data: { ...namedUpdateData(nextToken, now, body), ...destinationData(body) },
        })
      ).count;
    } else if (resource === "journal") {
      const status = editorialStatus(body.status ?? body.publicationState);
      changed = (
        await this.database.journalArticle.updateMany({
          where: { id, concurrencyToken: body.concurrencyToken },
          data: {
            title: body.name.trim(),
            slug: body.slug.trim().toLowerCase(),
            summary: clean(body.summary),
            content: clean(body.content),
            heroImage: clean(body.heroImage),
            status,
            datePublished: status === "published" ? now : null,
            updatedAtUtc: now,
            concurrencyToken: nextToken,
          },
        })
      ).count;
    } else if (isTaxonomy(resource)) {
      const data = {
        name: body.name.trim(),
        slug: body.slug.trim().toLowerCase(),
        updatedAtUtc: now,
        concurrencyToken: nextToken,
      };
      changed =
        resource === "product-types"
          ? (
              await this.database.productType.updateMany({
                where: { id, concurrencyToken: body.concurrencyToken },
                data,
              })
            ).count
          : resource === "categories"
            ? (
                await this.database.category.updateMany({
                  where: { id, concurrencyToken: body.concurrencyToken },
                  data,
                })
              ).count
            : (
                await this.database.tag.updateMany({
                  where: { id, concurrencyToken: body.concurrencyToken },
                  data,
                })
              ).count;
    } else {
      changed = (
        await this.database.mediaAsset.updateMany({
          where: { id, concurrencyToken: body.concurrencyToken },
          data: {
            assetKey: requiredValue(body.assetKey ?? body.name, "asset key"),
            altText: requiredValue(body.altText, "alternative text"),
            width: positiveDimension(body.width, "width"),
            height: positiveDimension(body.height, "height"),
            updatedAtUtc: now,
            concurrencyToken: nextToken,
          },
        })
      ).count;
    }
    if (changed !== 1) await this.missingOrConflict(resource, id);
    await this.audit.record(`admin-${resource}-updated`, "succeeded", user.subject, correlationId);
    return this.get(resource, id);
  }

  public async archive(
    resourceValue: string,
    idValue: string,
    user: AuthenticatedUser,
    correlationId: string,
  ): Promise<void> {
    const resource = contentResource(resourceValue);
    const id = requireUuid(idValue);
    if (isTaxonomy(resource) || resource === "media") {
      await this.deleteReferenceRecord(resource, id);
      await this.audit.record(
        `admin-${resource}-deleted`,
        "succeeded",
        user.subject,
        correlationId,
      );
      return;
    }
    const data = { updatedAtUtc: new Date(), concurrencyToken: randomUUID() };
    const result =
      resource === "products"
        ? await this.database.product.updateMany({
            where: { id },
            data: { ...data, publicationState: "Archived" },
          })
        : resource === "collections"
          ? await this.database.travelCollectionEntry.updateMany({
              where: { id },
              data: { ...data, publicationState: "Archived" },
            })
          : resource === "destinations"
            ? await this.database.destination.updateMany({
                where: { id },
                data: { ...data, publicationState: "Archived" },
              })
            : await this.database.journalArticle.updateMany({
                where: { id },
                data: { ...data, status: "archived" },
              });
    if (result.count !== 1) notFound();
    await this.audit.record(`admin-${resource}-archived`, "succeeded", user.subject, correlationId);
  }

  public async options() {
    const [productTypes, categories, collections, destinations, tags, media] = await Promise.all([
      this.database.productType.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      this.database.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      this.database.travelCollectionEntry.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      this.database.destination.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      this.database.tag.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      this.database.mediaAsset.findMany({
        orderBy: { assetKey: "asc" },
        select: { id: true, assetKey: true, altText: true },
      }),
    ]);
    return { productTypes, categories, collections, destinations, tags, media };
  }

  public async contact() {
    const setting = await this.database.siteSetting.findUnique({ where: { key: "contact" } });
    if (!setting) notFound();
    return {
      ...(setting.value as Record<string, unknown>),
      concurrencyToken: setting.concurrencyToken,
    };
  }

  public async updateContact(
    body: AdministrationContactWriteRequest,
    user: AuthenticatedUser,
    correlationId: string,
  ) {
    if (!body.concurrencyToken) conflict("The contact-page version is required.");
    const result = await this.database.siteSetting.updateMany({
      where: { key: "contact", concurrencyToken: body.concurrencyToken },
      data: {
        value: {
          email: body.email.trim().toLowerCase(),
          phone: body.phone?.trim() ?? "",
          eyebrow: body.eyebrow.trim(),
          heading: body.heading.trim(),
          description: body.description.trim(),
          promise: body.promise.trim(),
        },
        updatedAtUtc: new Date(),
        concurrencyToken: randomUUID(),
      },
    });
    if (result.count !== 1)
      conflict("This page was changed by another administrator. Reload and try again.");
    await this.audit.record("admin-contact-updated", "succeeded", user.subject, correlationId);
    return this.contact();
  }

  public async users(query: ContentQuery) {
    const p = pagination(query);
    const search = query.query?.trim() || null;
    const where = Prisma.sql`WHERE (${search}::text IS NULL OR u.email ILIKE '%' || ${search} || '%' OR u.display_name ILIKE '%' || ${search} || '%')`;
    const [items, counts] = await Promise.all([
      this.database.rows<Record<string, unknown>>(Prisma.sql`
        SELECT u.id, u.display_name AS "displayName", u.email, u.is_active AS "isActive",
               u.updated_at_utc AS "updatedAtUtc",
               COALESCE(array_agg(r.code ORDER BY r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
          FROM identity_access.users u
          LEFT JOIN identity_access.user_roles ur ON ur.user_id=u.id
          LEFT JOIN identity_access.roles r ON r.id=ur.role_id
          ${where}
         GROUP BY u.id ORDER BY u.updated_at_utc DESC OFFSET ${p.skip} LIMIT ${p.pageSize}`),
      this.database.rows<{ count: bigint }>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM identity_access.users u ${where}`,
      ),
    ]);
    return apiValue(page(items, Number(counts[0]?.count ?? 0), p.pageNumber, p.pageSize));
  }

  public async updateUser(
    idValue: string,
    body: AdministrationUserUpdateRequest,
    actor: AuthenticatedUser,
    correlationId: string,
  ) {
    const id = requireUuid(idValue);
    if (id === actor.subject && body.isActive === false)
      conflict("You cannot deactivate your own account.");
    await this.database.$transaction(async (tx) => {
      const user = await tx.applicationUser.findUnique({ where: { id } });
      if (!user) notFound();
      if (body.isActive !== undefined) {
        if (!body.isActive) await ensureAnotherAdministrator(tx, id);
        await tx.applicationUser.update({
          where: { id },
          data: {
            isActive: body.isActive,
            updatedAtUtc: new Date(),
            concurrencyToken: randomUUID(),
          },
        });
      }
      if (body.roles) {
        if (id === actor.subject && !body.roles.includes("administrator")) {
          conflict("You cannot remove your own administrator role.");
        }
        if (!body.roles.includes("administrator")) await ensureAnotherAdministrator(tx, id);
        const roles = await tx.role.findMany({ where: { code: { in: [...new Set(body.roles)] } } });
        if (roles.length !== new Set(body.roles).size) conflict("One or more roles do not exist.");
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (roles.length)
          await tx.userRole.createMany({
            data: roles.map((role) => ({ userId: id, roleId: role.id })),
          });
      }
    });
    await this.audit.record("admin-user-updated", "succeeded", actor.subject, correlationId);
    return { updated: true };
  }

  private product(id: string) {
    return this.database.product
      .findUnique({
        where: { id },
        include: {
          productCategories: { select: { categoryId: true } },
          productCollections: { select: { collectionId: true } },
          productDestinations: { select: { destinationId: true } },
          productTags: { select: { tagId: true } },
          productMedia: { orderBy: { sortOrder: "asc" }, select: { mediaAssetId: true } },
        },
      })
      .then((item) => {
        if (!item) notFound();
        return apiValue({
          ...item,
          summary: item.shortDescription,
          categoryIds: item.productCategories.map((x) => x.categoryId),
          collectionIds: item.productCollections.map((x) => x.collectionId),
          destinationIds: item.productDestinations.map((x) => x.destinationId),
          tagIds: item.productTags.map((x) => x.tagId),
          mediaAssetIds: item.productMedia.map((x) => x.mediaAssetId),
        });
      });
  }

  private collection(id: string) {
    return this.database.travelCollectionEntry.findUnique({ where: { id } }).then((item) => {
      if (!item) notFound();
      return apiValue(item);
    });
  }

  private destination(id: string) {
    return this.database.destination.findUnique({ where: { id } }).then((item) => {
      if (!item) notFound();
      return apiValue(item);
    });
  }

  private async taxonomyRecord(model: "productType" | "category" | "tag", id: string) {
    const item =
      model === "productType"
        ? await this.database.productType.findUnique({ where: { id } })
        : model === "category"
          ? await this.database.category.findUnique({ where: { id } })
          : await this.database.tag.findUnique({ where: { id } });
    if (!item) notFound();
    return apiValue(item);
  }

  private async deleteReferenceRecord(resource: Resource, id: string): Promise<void> {
    if (resource === "product-types") {
      if (await this.database.product.count({ where: { productTypeId: id } }))
        conflict("This product type is in use and cannot be deleted.");
      await this.database.productType.delete({ where: { id } }).catch(() => notFound());
    } else if (resource === "categories") {
      if (await this.database.productCategory.count({ where: { categoryId: id } }))
        conflict("This category is in use and cannot be deleted.");
      await this.database.category.delete({ where: { id } }).catch(() => notFound());
    } else if (resource === "tags") {
      if (await this.database.productTag.count({ where: { tagId: id } }))
        conflict("This tag is in use and cannot be deleted.");
      await this.database.tag.delete({ where: { id } }).catch(() => notFound());
    } else if (resource === "media") {
      const [products, collections, destinations] = await Promise.all([
        this.database.productMedia.count({ where: { mediaAssetId: id } }),
        this.database.travelCollectionEntry.count({ where: { heroMediaId: id } }),
        this.database.destination.count({ where: { heroMediaId: id } }),
      ]);
      if (products + collections + destinations > 0)
        conflict("This media asset is in use and cannot be deleted.");
      await this.database.mediaAsset.delete({ where: { id } }).catch(() => notFound());
    }
  }

  private async missingOrConflict(resource: Resource, id: string): Promise<never> {
    try {
      await this.get(resource, id);
    } catch {
      notFound();
    }
    conflict("This record was changed by another administrator. Reload and try again.");
  }
}

function contentResource(value: string): Resource {
  if ((resources as readonly string[]).includes(value)) return value as Resource;
  throw new DomainError(404, "The requested content resource does not exist.", "Not Found");
}

function validateContent(resource: Resource, body: AdministrationContentWriteRequest): void {
  required(body.name, "name");
  if (resource === "media") {
    required(body.assetKey ?? body.name, "asset key");
    required(body.altText, "alternative text");
    positiveDimension(body.width, "width");
    positiveDimension(body.height, "height");
    return;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(body.slug?.trim() ?? "")) {
    throw new DomainError(
      400,
      "Slug must contain lowercase letters, numbers, and hyphens only.",
      "Validation failed",
    );
  }
  if (resource === "products") {
    required(body.summary, "summary");
    required(body.description, "description");
    if (!body.productTypeId)
      throw new DomainError(400, "Product type is required.", "Validation failed");
  }
  if (resource === "destinations") {
    if ((body.latitude === undefined) !== (body.longitude === undefined)) {
      throw new DomainError(
        400,
        "Latitude and longitude must be supplied together.",
        "Validation failed",
      );
    }
    if (body.latitude !== undefined && (body.latitude < -90 || body.latitude > 90)) {
      throw new DomainError(400, "Latitude must be between -90 and 90.", "Validation failed");
    }
    if (body.longitude !== undefined && (body.longitude < -180 || body.longitude > 180)) {
      throw new DomainError(400, "Longitude must be between -180 and 180.", "Validation failed");
    }
  }
  if (!isTaxonomy(resource)) {
    publicationState(
      resource === "journal" ? (body.status ?? body.publicationState) : body.publicationState,
    );
  }
}

function isTaxonomy(resource: Resource): resource is "product-types" | "categories" | "tags" {
  return ["product-types", "categories", "tags"].includes(resource);
}

function taxonomyTable(resource: "product-types" | "categories" | "tags"): string {
  return resource === "product-types" ? "product_types" : resource;
}

function requiredValue(value: string | undefined, field: string): string {
  required(value, field);
  return value!.trim();
}

function positiveDimension(value: number | undefined, field: string): number {
  if (!Number.isInteger(value) || value! <= 0) {
    throw new DomainError(400, `${field} must be a positive whole number.`, "Validation failed");
  }
  return value!;
}

async function ensureAnotherAdministrator(
  tx: Prisma.TransactionClient,
  excludedUserId: string,
): Promise<void> {
  const count = await tx.userRole.count({
    where: {
      userId: { not: excludedUserId },
      role: { code: "administrator" },
      user: { isActive: true },
    },
  });
  if (count === 0) conflict("The final active administrator role cannot be removed.");
}

function productData(
  id: string,
  token: string,
  now: Date,
  body: AdministrationContentWriteRequest,
) {
  return {
    id,
    concurrencyToken: token,
    createdAtUtc: now,
    updatedAtUtc: now,
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase(),
    shortDescription: body.summary!.trim(),
    description: body.description!.trim(),
    productTypeId: body.productTypeId!,
    publicationState: catalogueStatus(body.publicationState),
    startingPrice: body.startingPrice,
    currency: (body.currency?.trim().toUpperCase() || "USD").slice(0, 3),
    durationMinutes: body.durationMinutes,
  };
}

function productUpdateData(token: string, now: Date, body: AdministrationContentWriteRequest) {
  return {
    concurrencyToken: token,
    updatedAtUtc: now,
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase(),
    shortDescription: body.summary!.trim(),
    description: body.description!.trim(),
    productTypeId: body.productTypeId!,
    publicationState: catalogueStatus(body.publicationState),
    startingPrice: body.startingPrice,
    currency: (body.currency?.trim().toUpperCase() || "USD").slice(0, 3),
    durationMinutes: body.durationMinutes,
  };
}

function namedData(id: string, token: string, now: Date, body: AdministrationContentWriteRequest) {
  return {
    id,
    concurrencyToken: token,
    createdAtUtc: now,
    updatedAtUtc: now,
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase(),
    summary: clean(body.summary),
    description: clean(body.description),
    heroMediaId: body.heroMediaId || null,
    publicationState: catalogueStatus(body.publicationState),
  };
}

function namedUpdateData(token: string, now: Date, body: AdministrationContentWriteRequest) {
  return {
    concurrencyToken: token,
    updatedAtUtc: now,
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase(),
    summary: clean(body.summary),
    description: clean(body.description),
    heroMediaId: body.heroMediaId || null,
    publicationState: catalogueStatus(body.publicationState),
  };
}

function destinationData(body: AdministrationContentWriteRequest) {
  return {
    latitude: body.latitude,
    longitude: body.longitude,
    district: clean(body.district),
    province: clean(body.province),
  };
}

async function replaceProductRelations(
  tx: Prisma.TransactionClient,
  productId: string,
  body: AdministrationContentWriteRequest,
) {
  await Promise.all([
    tx.productCategory.deleteMany({ where: { productId } }),
    tx.productCollectionLink.deleteMany({ where: { productId } }),
    tx.productDestination.deleteMany({ where: { productId } }),
    tx.productTag.deleteMany({ where: { productId } }),
    tx.productMedia.deleteMany({ where: { productId } }),
  ]);
  const categories = unique(body.categoryIds).map((categoryId) => ({ productId, categoryId }));
  const collections = unique(body.collectionIds).map((collectionId) => ({
    productId,
    collectionId,
  }));
  const destinations = unique(body.destinationIds).map((destinationId) => ({
    productId,
    destinationId,
  }));
  const tags = unique(body.tagIds).map((tagId) => ({ productId, tagId }));
  const media = unique(body.mediaAssetIds).map((mediaAssetId, sortOrder) => ({
    productId,
    mediaAssetId,
    sortOrder,
  }));
  if (categories.length) await tx.productCategory.createMany({ data: categories });
  if (collections.length) await tx.productCollectionLink.createMany({ data: collections });
  if (destinations.length) await tx.productDestination.createMany({ data: destinations });
  if (tags.length) await tx.productTag.createMany({ data: tags });
  if (media.length) await tx.productMedia.createMany({ data: media });
}

function unique(values: string[] | undefined): string[] {
  return [...new Set(values ?? [])];
}

function clean(value: string | undefined): string | null {
  return value?.trim() || null;
}

function required(value: string | undefined, field: string): void {
  if (!value?.trim()) throw new DomainError(400, `${field} is required.`, "Validation failed");
}

function catalogueStatus(value: string | undefined): string {
  const status = value || "Draft";
  if (!["Draft", "Published", "Archived"].includes(status)) {
    throw new DomainError(400, "Publication state is invalid.", "Validation failed");
  }
  return status;
}

function editorialStatus(value: string | undefined): string {
  return catalogueStatus(
    value ? `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}` : value,
  ).toLowerCase();
}

function publicationState(value: string | undefined): void {
  catalogueStatus(
    value ? `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}` : value,
  );
}

function isPublished(value: string | undefined): boolean {
  return value?.toLowerCase() === "published";
}

function notFound(): never {
  throw new DomainError(404, "The requested record was not found.", "Not Found");
}

function conflict(message: string): never {
  throw new DomainError(409, message, "Conflict");
}
