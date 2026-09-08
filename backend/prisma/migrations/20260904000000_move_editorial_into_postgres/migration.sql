-- Editorial content is now owned by the NestJS application database.
CREATE SCHEMA IF NOT EXISTS "editorial";

CREATE TABLE "editorial"."journal_articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" VARCHAR(16) NOT NULL DEFAULT 'draft',
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "hero_image" VARCHAR(2048),
    "date_published" TIMESTAMPTZ(6),

    CONSTRAINT "journal_articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "journal_articles_slug_key"
    ON "editorial"."journal_articles"("slug");
CREATE INDEX "ix_journal_articles_status_date_published"
    ON "editorial"."journal_articles"("status", "date_published");
ALTER TABLE "editorial"."journal_articles"
    ADD CONSTRAINT "ck_journal_articles_status"
    CHECK ("status" IN ('draft', 'published', 'archived'));

CREATE TABLE "editorial"."promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" VARCHAR(16) NOT NULL DEFAULT 'draft',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "title" VARCHAR(240) NOT NULL,
    "summary" TEXT,
    "cta_label" VARCHAR(120),
    "cta_url" VARCHAR(2048),
    "image" VARCHAR(2048),

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ix_promotions_status_sort"
    ON "editorial"."promotions"("status", "sort", "id");
ALTER TABLE "editorial"."promotions"
    ADD CONSTRAINT "ck_promotions_status"
    CHECK ("status" IN ('draft', 'published', 'archived'));
