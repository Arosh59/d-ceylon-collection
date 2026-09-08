CREATE TABLE "identity_access"."user_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "email" VARCHAR(320),
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "last_authenticated_at_utc" TIMESTAMPTZ(6),
    CONSTRAINT "PK_user_identities" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ux_user_identities_provider_subject"
    ON "identity_access"."user_identities"("provider", "subject");
CREATE INDEX "ix_user_identities_user_provider"
    ON "identity_access"."user_identities"("user_id", "provider");
CREATE INDEX "ix_user_identities_email"
    ON "identity_access"."user_identities"("email");

CREATE TABLE "identity_access"."password_credentials" (
    "user_id" UUID NOT NULL,
    "password_hash" VARCHAR(500) NOT NULL,
    "password_changed_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until_utc" TIMESTAMPTZ(6),
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "concurrency_token" UUID NOT NULL,
    CONSTRAINT "PK_password_credentials" PRIMARY KEY ("user_id")
);

CREATE TABLE "identity_access"."refresh_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at_utc" TIMESTAMPTZ(6),
    "replaced_by_session_id" UUID,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(64),
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PK_refresh_sessions" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ux_refresh_sessions_token_hash"
    ON "identity_access"."refresh_sessions"("token_hash");
CREATE INDEX "ix_refresh_sessions_user_expiry"
    ON "identity_access"."refresh_sessions"("user_id", "expires_at_utc");
CREATE INDEX "ix_refresh_sessions_family_revoked"
    ON "identity_access"."refresh_sessions"("family_id", "revoked_at_utc");

CREATE TABLE "identity_access"."password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at_utc" TIMESTAMPTZ(6),
    "request_ip" VARCHAR(64),
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ux_password_reset_tokens_token_hash"
    ON "identity_access"."password_reset_tokens"("token_hash");
CREATE INDEX "ix_password_reset_tokens_user_expiry"
    ON "identity_access"."password_reset_tokens"("user_id", "expires_at_utc");

ALTER TABLE "identity_access"."user_identities"
    ADD CONSTRAINT "FK_user_identities_users_user_id"
    FOREIGN KEY ("user_id") REFERENCES "identity_access"."users"("id") ON DELETE CASCADE;
ALTER TABLE "identity_access"."password_credentials"
    ADD CONSTRAINT "FK_password_credentials_users_user_id"
    FOREIGN KEY ("user_id") REFERENCES "identity_access"."users"("id") ON DELETE CASCADE;
ALTER TABLE "identity_access"."refresh_sessions"
    ADD CONSTRAINT "FK_refresh_sessions_users_user_id"
    FOREIGN KEY ("user_id") REFERENCES "identity_access"."users"("id") ON DELETE CASCADE;
ALTER TABLE "identity_access"."password_reset_tokens"
    ADD CONSTRAINT "FK_password_reset_tokens_users_user_id"
    FOREIGN KEY ("user_id") REFERENCES "identity_access"."users"("id") ON DELETE CASCADE;

-- Preserve existing external identity links without changing users or their role assignments.
INSERT INTO "identity_access"."user_identities"
    ("id", "user_id", "provider", "subject", "email", "created_at_utc", "updated_at_utc", "last_authenticated_at_utc")
SELECT gen_random_uuid(), "id", 'legacy-oidc', "subject", lower("email"), "created_at_utc", "updated_at_utc", "last_authenticated_at_utc"
FROM "identity_access"."users"
ON CONFLICT ("provider", "subject") DO NOTHING;
