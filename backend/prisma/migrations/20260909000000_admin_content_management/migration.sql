ALTER TABLE "identity_access"."password_credentials"
    ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "editorial"."journal_articles"
    ADD COLUMN "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "concurrency_token" UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE "editorial"."promotions"
    ADD COLUMN "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "concurrency_token" UUID NOT NULL DEFAULT gen_random_uuid();

CREATE TABLE "editorial"."site_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concurrency_token" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

INSERT INTO "editorial"."site_settings" ("key", "value")
VALUES (
    'contact',
    jsonb_build_object(
        'email', 'hello@dceyloncollection.com',
        'phone', '',
        'eyebrow', 'Contact D Ceylon',
        'heading', 'Tell us what you’re hoping to find.',
        'description', 'A place, a feeling, or a first question is enough. We’ll help you find a considered way into Sri Lanka.',
        'promise', 'We’ll reply with a human point of view, not a packed itinerary or a hard sell.'
    )
)
ON CONFLICT ("key") DO NOTHING;
