-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "bookings";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalogue";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "customers_travellers";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity_access";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "itineraries_travel_planning";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "organisations_agents";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "payments";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "quotes";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "supplier_operations";

-- CreateTable
CREATE TABLE "organisations_agents"."agents" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "organisation_id" UUID NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "PK_agents" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_access"."users" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(320),
    "is_active" BOOLEAN NOT NULL,
    "issuer" VARCHAR(500) NOT NULL,
    "last_authenticated_at_utc" TIMESTAMPTZ(6),
    "subject" VARCHAR(200) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_users" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_operations"."arrivals" (
    "Id" UUID NOT NULL,
    "Airport" VARCHAR(120) NOT NULL,
    "ArrivalAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "BookingId" UUID NOT NULL,
    "ConcurrencyToken" UUID NOT NULL,
    "CreatedAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "FlightNumber" VARCHAR(30),
    "Notes" VARCHAR(1000),
    "Status" VARCHAR(20) NOT NULL,
    "UpdatedAtUtc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_arrivals" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "bookings"."bookings" (
    "id" UUID NOT NULL,
    "booking_reference" VARCHAR(30) NOT NULL,
    "cancelled_at_utc" TIMESTAMPTZ(6),
    "cancellation_reason" VARCHAR(500),
    "confirmed_at_utc" TIMESTAMPTZ(6),
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "customer_notes" VARCHAR(2000),
    "customer_id" UUID NOT NULL,
    "internal_notes" VARCHAR(2000),
    "itinerary_title" VARCHAR(200) NOT NULL,
    "organisation_id" UUID,
    "paid_amount" DECIMAL(18,2) NOT NULL,
    "quote_id" UUID NOT NULL,
    "quote_version_id" UUID NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "travel_end_date" DATE NOT NULL,
    "travel_start_date" DATE NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_bookings" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings"."booking_items" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "description" VARCHAR(1000),
    "line_total" DECIMAL(18,2) NOT NULL,
    "position" INTEGER NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "unit_amount" DECIMAL(18,2) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_booking_items" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_operations"."booking_operation_tasks" (
    "Id" UUID NOT NULL,
    "BookingId" UUID NOT NULL,
    "ConcurrencyToken" UUID NOT NULL,
    "CreatedAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "DueDate" DATE,
    "Notes" VARCHAR(2000),
    "Status" VARCHAR(20) NOT NULL,
    "SupplierId" UUID,
    "Title" VARCHAR(200) NOT NULL,
    "UpdatedAtUtc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_booking_operation_tasks" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "supplier_operations"."booking_resource_assignments" (
    "Id" UUID NOT NULL,
    "BookingId" UUID NOT NULL,
    "ConcurrencyToken" UUID NOT NULL,
    "CreatedAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "DriverId" UUID,
    "GuideId" UUID,
    "Notes" VARCHAR(1000),
    "ServiceDate" DATE NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "UpdatedAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "VehicleId" UUID,

    CONSTRAINT "PK_booking_resource_assignments" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "catalogue"."categories" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_categories" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_access"."customers" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "PK_customers" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers_travellers"."customer_profiles" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "contact_email" VARCHAR(320),
    "contact_phone" VARCHAR(40),
    "country_code" CHAR(2),
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "customer_id" UUID NOT NULL,
    "family_name" VARCHAR(100) NOT NULL,
    "given_name" VARCHAR(100) NOT NULL,
    "marketing_consent" BOOLEAN NOT NULL,
    "preferred_contact_method" VARCHAR(20) NOT NULL,
    "preferred_locale" VARCHAR(20) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_customer_profiles" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogue"."destinations" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "description" VARCHAR(4000),
    "hero_media_id" UUID,
    "name" VARCHAR(160) NOT NULL,
    "publication_state" VARCHAR(32) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "summary" VARCHAR(500),
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_destinations" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_operations"."drivers" (
    "Id" UUID NOT NULL,
    "ConcurrencyToken" UUID NOT NULL,
    "CreatedAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "LicenceNumber" VARCHAR(80),
    "Name" VARCHAR(160) NOT NULL,
    "Phone" VARCHAR(40) NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "UpdatedAtUtc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_drivers" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "supplier_operations"."guides" (
    "Id" UUID NOT NULL,
    "ConcurrencyToken" UUID NOT NULL,
    "CreatedAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "Languages" VARCHAR(300),
    "Name" VARCHAR(160) NOT NULL,
    "Phone" VARCHAR(40) NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "UpdatedAtUtc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_guides" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "bookings"."invoices" (
    "id" UUID NOT NULL,
    "adjustment_total" DECIMAL(18,2) NOT NULL,
    "booking_id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "document_key" VARCHAR(500),
    "due_at_utc" TIMESTAMPTZ(6),
    "grand_total" DECIMAL(18,2) NOT NULL,
    "invoice_number" VARCHAR(30) NOT NULL,
    "issued_at_utc" TIMESTAMPTZ(6),
    "paid_at_utc" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "tax_total" DECIMAL(18,2) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_invoices" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries_travel_planning"."itinerary_days" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "date" DATE NOT NULL,
    "day_number" INTEGER NOT NULL,
    "itinerary_revision_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_itinerary_days" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries_travel_planning"."itinerary_items" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "destination_slug" VARCHAR(200) NOT NULL,
    "duration_minutes" INTEGER,
    "itinerary_day_id" UUID NOT NULL,
    "notes" VARCHAR(2000),
    "position" INTEGER NOT NULL,
    "product_slug" VARCHAR(200),
    "source" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_itinerary_items" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries_travel_planning"."itinerary_revisions" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "generated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "input_fingerprint" VARCHAR(64) NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "rule_version" VARCHAR(100) NOT NULL,
    "travel_plan_id" UUID NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_itinerary_revisions" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogue"."media_assets" (
    "id" UUID NOT NULL,
    "alt_text" VARCHAR(300) NOT NULL,
    "asset_key" VARCHAR(200) NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "height" INTEGER NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "width" INTEGER NOT NULL,

    CONSTRAINT "PK_media_assets" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisations_agents"."organisations" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_organisations" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisations_agents"."organisation_users" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "membership_role" VARCHAR(100) NOT NULL,
    "organisation_id" UUID NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "PK_organisation_users" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payments" (
    "id" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "booking_id" UUID NOT NULL,
    "captured_at_utc" TIMESTAMPTZ(6),
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "customer_id" UUID NOT NULL,
    "failed_reason" VARCHAR(500),
    "gateway" VARCHAR(30) NOT NULL,
    "idempotency_key" VARCHAR(64) NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "payment_link_expires_at_utc" TIMESTAMPTZ(6),
    "payment_link_url" VARCHAR(500),
    "reconciliation_status" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_payments" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."payment_transactions" (
    "id" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "gateway" VARCHAR(30) NOT NULL,
    "gateway_reference" VARCHAR(200) NOT NULL,
    "occurred_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "payment_id" UUID NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "webhook_signature_verified" BOOLEAN NOT NULL,

    CONSTRAINT "PK_payment_transactions" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_access"."permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(160) NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogue"."products" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "description" VARCHAR(4000) NOT NULL,
    "duration_minutes" INTEGER,
    "name" VARCHAR(200) NOT NULL,
    "product_type_id" UUID NOT NULL,
    "publication_state" VARCHAR(32) NOT NULL,
    "search_vector" tsvector GENERATED ALWAYS AS (
        to_tsvector(
            'english'::regconfig,
            COALESCE("name", '') || ' ' || COALESCE("short_description", '') || ' ' || COALESCE("description", '')
        )
    ) STORED NOT NULL,
    "short_description" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "starting_price" DECIMAL(18,2),
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_products" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogue"."product_categories" (
    "product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "PK_product_categories" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "catalogue"."product_collections" (
    "product_id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,

    CONSTRAINT "PK_product_collections" PRIMARY KEY ("product_id","collection_id")
);

-- CreateTable
CREATE TABLE "catalogue"."product_destinations" (
    "product_id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,

    CONSTRAINT "PK_product_destinations" PRIMARY KEY ("product_id","destination_id")
);

-- CreateTable
CREATE TABLE "catalogue"."product_media" (
    "product_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "PK_product_media" PRIMARY KEY ("product_id","media_asset_id")
);

-- CreateTable
CREATE TABLE "catalogue"."product_tags" (
    "product_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "PK_product_tags" PRIMARY KEY ("product_id","tag_id")
);

-- CreateTable
CREATE TABLE "catalogue"."product_types" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_product_types" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes"."quotes" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "currency" VARCHAR(3),
    "current_expires_at_utc" TIMESTAMPTZ(6),
    "current_version_id" UUID,
    "current_version_number" INTEGER NOT NULL,
    "customer_id" UUID NOT NULL,
    "draft_terms" VARCHAR(5000),
    "internal_notes" VARCHAR(2000),
    "organisation_id" UUID,
    "request_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_quotes" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes"."quote_draft_lines" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "description" VARCHAR(1000),
    "position" INTEGER NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "quote_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "unit_amount" DECIMAL(18,2) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_quote_draft_lines" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes"."quote_draft_price_components" (
    "id" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "position" INTEGER NOT NULL,
    "quote_id" UUID NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_quote_draft_price_components" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes"."quote_requests" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "customer_id" UUID NOT NULL,
    "customer_notes" VARCHAR(2000),
    "itinerary_fingerprint" VARCHAR(64) NOT NULL,
    "itinerary_revision_id" UUID NOT NULL,
    "itinerary_revision_number" INTEGER NOT NULL,
    "itinerary_title" VARCHAR(200) NOT NULL,
    "rule_version" VARCHAR(100) NOT NULL,
    "travel_end_date" DATE NOT NULL,
    "travel_plan_id" UUID NOT NULL,
    "travel_start_date" DATE NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_quote_requests" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes"."quote_versions" (
    "id" UUID NOT NULL,
    "adjustment_total" DECIMAL(18,2) NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "created_by_subject" VARCHAR(200) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "expires_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "grand_total" DECIMAL(18,2) NOT NULL,
    "quote_id" UUID NOT NULL,
    "sent_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "tax_total" DECIMAL(18,2) NOT NULL,
    "terms" VARCHAR(5000) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "version_number" INTEGER NOT NULL,

    CONSTRAINT "PK_quote_versions" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes"."quote_version_lines" (
    "id" UUID NOT NULL,
    "description" VARCHAR(1000),
    "line_total" DECIMAL(18,2) NOT NULL,
    "position" INTEGER NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "quote_version_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "unit_amount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "PK_quote_version_lines" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes"."quote_version_price_components" (
    "id" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "position" INTEGER NOT NULL,
    "quote_version_id" UUID NOT NULL,

    CONSTRAINT "PK_quote_version_price_components" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments"."refunds" (
    "id" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "approved_by_subject" VARCHAR(200),
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "gateway_reference" VARCHAR(200),
    "idempotency_key" VARCHAR(64) NOT NULL,
    "initiated_by_subject" VARCHAR(200) NOT NULL,
    "payment_id" UUID NOT NULL,
    "reason" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_refunds" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_access"."roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_roles" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_access"."role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "customers_travellers"."saved_itineraries" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "customer_id" UUID NOT NULL,
    "is_archived" BOOLEAN NOT NULL,
    "primary_destination_slug" VARCHAR(200),
    "summary" VARCHAR(2000),
    "title" VARCHAR(200) NOT NULL,
    "travel_end_date" DATE,
    "travel_start_date" DATE,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_saved_itineraries" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_access"."security_audit_events" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "correlation_id" VARCHAR(128) NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "event_type" VARCHAR(120) NOT NULL,
    "occurred_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "outcome" VARCHAR(40) NOT NULL,
    "subject" VARCHAR(200),
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_security_audit_events" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_operations"."suppliers" (
    "Id" UUID NOT NULL,
    "Category" VARCHAR(60) NOT NULL,
    "ConcurrencyToken" UUID NOT NULL,
    "ContactEmail" VARCHAR(320),
    "ContactName" VARCHAR(120),
    "CreatedAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "Name" VARCHAR(200) NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "UpdatedAtUtc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_suppliers" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "catalogue"."tags" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_tags" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogue"."collections" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "description" VARCHAR(4000),
    "hero_media_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "publication_state" VARCHAR(32) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "summary" VARCHAR(500),
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_collections" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers_travellers"."travellers" (
    "id" UUID NOT NULL,
    "accessibility_needs" VARCHAR(1000),
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "customer_id" UUID NOT NULL,
    "date_of_birth" DATE,
    "dietary_needs" VARCHAR(1000),
    "emergency_contact_name" VARCHAR(200),
    "emergency_contact_phone" VARCHAR(40),
    "family_name" VARCHAR(100) NOT NULL,
    "given_name" VARCHAR(100) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_travellers" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries_travel_planning"."travel_plans" (
    "id" UUID NOT NULL,
    "accessibility_considerations" VARCHAR(1000),
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "current_revision_number" INTEGER NOT NULL,
    "customer_id" UUID NOT NULL,
    "dietary_considerations" VARCHAR(1000),
    "input_fingerprint" VARCHAR(64) NOT NULL,
    "pace" VARCHAR(20) NOT NULL,
    "rule_version" VARCHAR(100) NOT NULL,
    "saved_itinerary_id" UUID,
    "status" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "travel_end_date" DATE NOT NULL,
    "travel_start_date" DATE NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_travel_plans" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries_travel_planning"."travel_plan_destinations" (
    "travel_plan_id" UUID NOT NULL,
    "destination_slug" VARCHAR(200) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "PK_travel_plan_destinations" PRIMARY KEY ("travel_plan_id","destination_slug")
);

-- CreateTable
CREATE TABLE "itineraries_travel_planning"."travel_plan_interests" (
    "travel_plan_id" UUID NOT NULL,
    "interest_slug" VARCHAR(200) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "PK_travel_plan_interests" PRIMARY KEY ("travel_plan_id","interest_slug")
);

-- CreateTable
CREATE TABLE "itineraries_travel_planning"."travel_plan_preferences" (
    "travel_plan_id" UUID NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "PK_travel_plan_preferences" PRIMARY KEY ("travel_plan_id","kind","slug")
);

-- CreateTable
CREATE TABLE "itineraries_travel_planning"."travel_plan_travellers" (
    "travel_plan_id" UUID NOT NULL,
    "traveller_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "PK_travel_plan_travellers" PRIMARY KEY ("travel_plan_id","traveller_id")
);

-- CreateTable
CREATE TABLE "identity_access"."user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "supplier_operations"."vehicles" (
    "Id" UUID NOT NULL,
    "Capacity" INTEGER NOT NULL,
    "ConcurrencyToken" UUID NOT NULL,
    "CreatedAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "Name" VARCHAR(160) NOT NULL,
    "Notes" VARCHAR(1000),
    "RegistrationNumber" VARCHAR(40) NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "SupplierId" UUID,
    "UpdatedAtUtc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_vehicles" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "bookings"."vouchers" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "description" VARCHAR(2000),
    "document_key" VARCHAR(500),
    "issued_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "redeemed_at_utc" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_until" DATE NOT NULL,
    "voucher_code" VARCHAR(50) NOT NULL,

    CONSTRAINT "PK_vouchers" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers_travellers"."wishlist_entries" (
    "id" UUID NOT NULL,
    "concurrency_token" UUID NOT NULL,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "customer_id" UUID NOT NULL,
    "note" VARCHAR(500),
    "product_slug" VARCHAR(200) NOT NULL,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_wishlist_entries" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_agents_organisation_active" ON "organisations_agents"."agents"("organisation_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_agents_user_id" ON "organisations_agents"."agents"("user_id");

-- CreateIndex
CREATE INDEX "ix_users_email" ON "identity_access"."users"("email");

-- CreateIndex
CREATE INDEX "ix_users_is_active" ON "identity_access"."users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_users_issuer_subject" ON "identity_access"."users"("issuer", "subject");

-- CreateIndex
CREATE INDEX "IX_arrivals_BookingId_ArrivalAtUtc" ON "supplier_operations"."arrivals"("BookingId", "ArrivalAtUtc");

-- CreateIndex
CREATE INDEX "IX_arrivals_Status_ArrivalAtUtc" ON "supplier_operations"."arrivals"("Status", "ArrivalAtUtc");

-- CreateIndex
CREATE INDEX "ix_bookings_customer_status_updated" ON "bookings"."bookings"("customer_id", "status", "updated_at_utc");

-- CreateIndex
CREATE INDEX "ix_bookings_organisation_status_updated" ON "bookings"."bookings"("organisation_id", "status", "updated_at_utc");

-- CreateIndex
CREATE INDEX "ix_bookings_status_start_date" ON "bookings"."bookings"("status", "travel_start_date");

-- CreateIndex
CREATE UNIQUE INDEX "ux_bookings_reference" ON "bookings"."bookings"("booking_reference");

-- CreateIndex
CREATE UNIQUE INDEX "ux_bookings_quote" ON "bookings"."bookings"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_booking_items_order" ON "bookings"."booking_items"("booking_id", "position");

-- CreateIndex
CREATE INDEX "IX_booking_operation_tasks_BookingId_Status" ON "supplier_operations"."booking_operation_tasks"("BookingId", "Status");

-- CreateIndex
CREATE INDEX "IX_booking_operation_tasks_SupplierId_Status" ON "supplier_operations"."booking_operation_tasks"("SupplierId", "Status");

-- CreateIndex
CREATE INDEX "IX_booking_resource_assignments_BookingId_ServiceDate" ON "supplier_operations"."booking_resource_assignments"("BookingId", "ServiceDate");

-- CreateIndex
CREATE INDEX "IX_booking_resource_assignments_DriverId_ServiceDate" ON "supplier_operations"."booking_resource_assignments"("DriverId", "ServiceDate");

-- CreateIndex
CREATE INDEX "IX_booking_resource_assignments_GuideId_ServiceDate" ON "supplier_operations"."booking_resource_assignments"("GuideId", "ServiceDate");

-- CreateIndex
CREATE INDEX "IX_booking_resource_assignments_VehicleId_ServiceDate" ON "supplier_operations"."booking_resource_assignments"("VehicleId", "ServiceDate");

-- CreateIndex
CREATE INDEX "ix_categories_name" ON "catalogue"."categories"("name");

-- CreateIndex
CREATE INDEX "ix_categories_updated_at_utc" ON "catalogue"."categories"("updated_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "ux_categories_slug" ON "catalogue"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ux_customers_user_id" ON "identity_access"."customers"("user_id");

-- CreateIndex
CREATE INDEX "ix_customer_profiles_contact_email" ON "customers_travellers"."customer_profiles"("contact_email");

-- CreateIndex
CREATE INDEX "ix_customer_profiles_updated_at" ON "customers_travellers"."customer_profiles"("updated_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "ux_customer_profiles_customer_id" ON "customers_travellers"."customer_profiles"("customer_id");

-- CreateIndex
CREATE INDEX "ix_destinations_hero_media_id" ON "catalogue"."destinations"("hero_media_id");

-- CreateIndex
CREATE INDEX "ix_destinations_name" ON "catalogue"."destinations"("name");

-- CreateIndex
CREATE INDEX "ix_destinations_publication_state" ON "catalogue"."destinations"("publication_state");

-- CreateIndex
CREATE INDEX "ix_destinations_updated_at_utc" ON "catalogue"."destinations"("updated_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "ux_destinations_slug" ON "catalogue"."destinations"("slug");

-- CreateIndex
CREATE INDEX "IX_drivers_Status_Name" ON "supplier_operations"."drivers"("Status", "Name");

-- CreateIndex
CREATE UNIQUE INDEX "IX_drivers_LicenceNumber" ON "supplier_operations"."drivers"("LicenceNumber");

-- CreateIndex
CREATE INDEX "IX_guides_Status_Name" ON "supplier_operations"."guides"("Status", "Name");

-- CreateIndex
CREATE INDEX "ix_invoices_booking_status" ON "bookings"."invoices"("booking_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ux_invoices_number" ON "bookings"."invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "ux_itinerary_days_revision_order" ON "itineraries_travel_planning"."itinerary_days"("itinerary_revision_id", "day_number");

-- CreateIndex
CREATE INDEX "ix_itinerary_items_destination_slug" ON "itineraries_travel_planning"."itinerary_items"("destination_slug");

-- CreateIndex
CREATE INDEX "ix_itinerary_items_product_slug" ON "itineraries_travel_planning"."itinerary_items"("product_slug");

-- CreateIndex
CREATE INDEX "ix_itinerary_items_day_order" ON "itineraries_travel_planning"."itinerary_items"("itinerary_day_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ux_itinerary_revisions_plan_number" ON "itineraries_travel_planning"."itinerary_revisions"("travel_plan_id", "revision_number");

-- CreateIndex
CREATE INDEX "ix_media_assets_updated_at_utc" ON "catalogue"."media_assets"("updated_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "ux_media_assets_asset_key" ON "catalogue"."media_assets"("asset_key");

-- CreateIndex
CREATE INDEX "ix_organisations_is_active" ON "organisations_agents"."organisations"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_organisations_slug" ON "organisations_agents"."organisations"("slug");

-- CreateIndex
CREATE INDEX "ix_organisation_users_user_id" ON "organisations_agents"."organisation_users"("user_id");

-- CreateIndex
CREATE INDEX "ix_organisation_users_organisation_active" ON "organisations_agents"."organisation_users"("organisation_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ux_organisation_users_organisation_user" ON "organisations_agents"."organisation_users"("organisation_id", "user_id");

-- CreateIndex
CREATE INDEX "ix_payments_customer_booking_status" ON "payments"."payments"("customer_id", "booking_id", "status");

-- CreateIndex
CREATE INDEX "ix_payments_booking_status" ON "payments"."payments"("booking_id", "status");

-- CreateIndex
CREATE INDEX "ix_payments_reconciliation_status" ON "payments"."payments"("reconciliation_status", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ux_payments_idempotency_key" ON "payments"."payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "ix_payment_transactions_payment_occurred" ON "payments"."payment_transactions"("payment_id", "occurred_at_utc");

-- CreateIndex
CREATE INDEX "ix_payment_transactions_gateway_reference" ON "payments"."payment_transactions"("gateway_reference");

-- CreateIndex
CREATE UNIQUE INDEX "ux_permissions_code" ON "identity_access"."permissions"("code");

-- CreateIndex
CREATE INDEX "ix_products_name" ON "catalogue"."products"("name");

-- CreateIndex
CREATE INDEX "ix_products_product_type_id" ON "catalogue"."products"("product_type_id");

-- CreateIndex
CREATE INDEX "ix_products_publication_state" ON "catalogue"."products"("publication_state");

-- CreateIndex
CREATE INDEX "ix_products_search_vector" ON "catalogue"."products" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "ix_products_updated_at_utc" ON "catalogue"."products"("updated_at_utc");

-- CreateIndex
CREATE INDEX "ix_products_publication_state_name" ON "catalogue"."products"("publication_state", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ux_products_slug" ON "catalogue"."products"("slug");

-- CreateIndex
CREATE INDEX "ix_product_categories_category_id" ON "catalogue"."product_categories"("category_id");

-- CreateIndex
CREATE INDEX "ix_product_collections_collection_id" ON "catalogue"."product_collections"("collection_id");

-- CreateIndex
CREATE INDEX "ix_product_destinations_destination_id" ON "catalogue"."product_destinations"("destination_id");

-- CreateIndex
CREATE INDEX "ix_product_media_media_asset_id" ON "catalogue"."product_media"("media_asset_id");

-- CreateIndex
CREATE INDEX "ix_product_media_product_id_sort_order" ON "catalogue"."product_media"("product_id", "sort_order");

-- CreateIndex
CREATE INDEX "ix_product_tags_tag_id" ON "catalogue"."product_tags"("tag_id");

-- CreateIndex
CREATE INDEX "ix_product_types_name" ON "catalogue"."product_types"("name");

-- CreateIndex
CREATE INDEX "ix_product_types_updated_at_utc" ON "catalogue"."product_types"("updated_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "ux_product_types_slug" ON "catalogue"."product_types"("slug");

-- CreateIndex
CREATE INDEX "ix_quotes_status_expiry" ON "quotes"."quotes"("status", "current_expires_at_utc");

-- CreateIndex
CREATE INDEX "ix_quotes_customer_status_updated" ON "quotes"."quotes"("customer_id", "status", "updated_at_utc");

-- CreateIndex
CREATE INDEX "ix_quotes_organisation_status_updated" ON "quotes"."quotes"("organisation_id", "status", "updated_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "ux_quotes_request" ON "quotes"."quotes"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_quote_draft_lines_order" ON "quotes"."quote_draft_lines"("quote_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ux_quote_draft_components_order" ON "quotes"."quote_draft_price_components"("quote_id", "position");

-- CreateIndex
CREATE INDEX "ix_quote_requests_travel_plan" ON "quotes"."quote_requests"("travel_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_quote_requests_customer_revision" ON "quotes"."quote_requests"("customer_id", "itinerary_revision_id");

-- CreateIndex
CREATE INDEX "ix_quote_versions_expiry" ON "quotes"."quote_versions"("expires_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "ux_quote_versions_quote_number" ON "quotes"."quote_versions"("quote_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "ux_quote_version_lines_order" ON "quotes"."quote_version_lines"("quote_version_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ux_quote_version_components_order" ON "quotes"."quote_version_price_components"("quote_version_id", "position");

-- CreateIndex
CREATE INDEX "ix_refunds_payment_status" ON "payments"."refunds"("payment_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ux_refunds_idempotency_key" ON "payments"."refunds"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "ux_roles_code" ON "identity_access"."roles"("code");

-- CreateIndex
CREATE INDEX "ix_role_permissions_permission_id" ON "identity_access"."role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "ix_saved_itineraries_destination_slug" ON "customers_travellers"."saved_itineraries"("primary_destination_slug");

-- CreateIndex
CREATE INDEX "ix_saved_itineraries_updated_at" ON "customers_travellers"."saved_itineraries"("updated_at_utc");

-- CreateIndex
CREATE INDEX "ix_saved_itineraries_customer_archived_updated" ON "customers_travellers"."saved_itineraries"("customer_id", "is_archived", "updated_at_utc");

-- CreateIndex
CREATE INDEX "ix_security_audit_events_correlation_id" ON "identity_access"."security_audit_events"("correlation_id");

-- CreateIndex
CREATE INDEX "ix_security_audit_events_occurred_at" ON "identity_access"."security_audit_events"("occurred_at_utc");

-- CreateIndex
CREATE INDEX "ix_security_audit_events_subject_occurred_at" ON "identity_access"."security_audit_events"("subject", "occurred_at_utc");

-- CreateIndex
CREATE INDEX "IX_suppliers_Status_Name" ON "supplier_operations"."suppliers"("Status", "Name");

-- CreateIndex
CREATE INDEX "ix_tags_name" ON "catalogue"."tags"("name");

-- CreateIndex
CREATE INDEX "ix_tags_updated_at_utc" ON "catalogue"."tags"("updated_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "ux_tags_slug" ON "catalogue"."tags"("slug");

-- CreateIndex
CREATE INDEX "ix_collections_hero_media_id" ON "catalogue"."collections"("hero_media_id");

-- CreateIndex
CREATE INDEX "ix_collections_name" ON "catalogue"."collections"("name");

-- CreateIndex
CREATE INDEX "ix_collections_publication_state" ON "catalogue"."collections"("publication_state");

-- CreateIndex
CREATE INDEX "ix_collections_updated_at_utc" ON "catalogue"."collections"("updated_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "ux_collections_slug" ON "catalogue"."collections"("slug");

-- CreateIndex
CREATE INDEX "ix_travellers_customer_id" ON "customers_travellers"."travellers"("customer_id");

-- CreateIndex
CREATE INDEX "ix_travellers_updated_at" ON "customers_travellers"."travellers"("updated_at_utc");

-- CreateIndex
CREATE INDEX "ix_travellers_customer_name" ON "customers_travellers"."travellers"("customer_id", "family_name", "given_name");

-- CreateIndex
CREATE INDEX "ix_travel_plans_customer_saved_itinerary" ON "itineraries_travel_planning"."travel_plans"("customer_id", "saved_itinerary_id");

-- CreateIndex
CREATE INDEX "ix_travel_plans_rule_fingerprint" ON "itineraries_travel_planning"."travel_plans"("rule_version", "input_fingerprint");

-- CreateIndex
CREATE INDEX "ix_travel_plans_customer_status_updated" ON "itineraries_travel_planning"."travel_plans"("customer_id", "status", "updated_at_utc");

-- CreateIndex
CREATE INDEX "ix_travel_plan_destinations_slug" ON "itineraries_travel_planning"."travel_plan_destinations"("destination_slug");

-- CreateIndex
CREATE UNIQUE INDEX "ux_travel_plan_destinations_order" ON "itineraries_travel_planning"."travel_plan_destinations"("travel_plan_id", "position");

-- CreateIndex
CREATE INDEX "ix_travel_plan_preferences_lookup" ON "itineraries_travel_planning"."travel_plan_preferences"("kind", "slug");

-- CreateIndex
CREATE INDEX "ix_travel_plan_travellers_traveller" ON "itineraries_travel_planning"."travel_plan_travellers"("traveller_id");

-- CreateIndex
CREATE INDEX "ix_user_roles_role_id" ON "identity_access"."user_roles"("role_id");

-- CreateIndex
CREATE INDEX "IX_vehicles_SupplierId_Status" ON "supplier_operations"."vehicles"("SupplierId", "Status");

-- CreateIndex
CREATE UNIQUE INDEX "IX_vehicles_RegistrationNumber" ON "supplier_operations"."vehicles"("RegistrationNumber");

-- CreateIndex
CREATE INDEX "ix_vouchers_booking_status" ON "bookings"."vouchers"("booking_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ux_vouchers_code" ON "bookings"."vouchers"("voucher_code");

-- CreateIndex
CREATE INDEX "ix_wishlist_entries_updated_at" ON "customers_travellers"."wishlist_entries"("updated_at_utc");

-- CreateIndex
CREATE INDEX "ix_wishlist_entries_customer_created_at" ON "customers_travellers"."wishlist_entries"("customer_id", "created_at_utc");

-- CreateIndex
CREATE UNIQUE INDEX "ux_wishlist_entries_customer_product" ON "customers_travellers"."wishlist_entries"("customer_id", "product_slug");

-- AddForeignKey
ALTER TABLE "organisations_agents"."agents" ADD CONSTRAINT "FK_agents_organisations_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations_agents"."organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings"."booking_items" ADD CONSTRAINT "FK_booking_items_bookings_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_access"."customers" ADD CONSTRAINT "FK_customers_users_user_id" FOREIGN KEY ("user_id") REFERENCES "identity_access"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings"."invoices" ADD CONSTRAINT "FK_invoices_bookings_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries_travel_planning"."itinerary_days" ADD CONSTRAINT "FK_itinerary_days_itinerary_revisions_itinerary_revision_id" FOREIGN KEY ("itinerary_revision_id") REFERENCES "itineraries_travel_planning"."itinerary_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries_travel_planning"."itinerary_items" ADD CONSTRAINT "FK_itinerary_items_itinerary_days_itinerary_day_id" FOREIGN KEY ("itinerary_day_id") REFERENCES "itineraries_travel_planning"."itinerary_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries_travel_planning"."itinerary_revisions" ADD CONSTRAINT "FK_itinerary_revisions_travel_plans_travel_plan_id" FOREIGN KEY ("travel_plan_id") REFERENCES "itineraries_travel_planning"."travel_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisations_agents"."organisation_users" ADD CONSTRAINT "FK_organisation_users_organisations_organisation_id" FOREIGN KEY ("organisation_id") REFERENCES "organisations_agents"."organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."payment_transactions" ADD CONSTRAINT "FK_payment_transactions_payments_payment_id" FOREIGN KEY ("payment_id") REFERENCES "payments"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."products" ADD CONSTRAINT "FK_products_product_types_product_type_id" FOREIGN KEY ("product_type_id") REFERENCES "catalogue"."product_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."product_categories" ADD CONSTRAINT "FK_product_categories_categories_category_id" FOREIGN KEY ("category_id") REFERENCES "catalogue"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."product_categories" ADD CONSTRAINT "FK_product_categories_products_product_id" FOREIGN KEY ("product_id") REFERENCES "catalogue"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."product_collections" ADD CONSTRAINT "FK_product_collections_collections_collection_id" FOREIGN KEY ("collection_id") REFERENCES "catalogue"."collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."product_collections" ADD CONSTRAINT "FK_product_collections_products_product_id" FOREIGN KEY ("product_id") REFERENCES "catalogue"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."product_destinations" ADD CONSTRAINT "FK_product_destinations_destinations_destination_id" FOREIGN KEY ("destination_id") REFERENCES "catalogue"."destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."product_destinations" ADD CONSTRAINT "FK_product_destinations_products_product_id" FOREIGN KEY ("product_id") REFERENCES "catalogue"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."product_media" ADD CONSTRAINT "FK_product_media_media_assets_media_asset_id" FOREIGN KEY ("media_asset_id") REFERENCES "catalogue"."media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."product_media" ADD CONSTRAINT "FK_product_media_products_product_id" FOREIGN KEY ("product_id") REFERENCES "catalogue"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."product_tags" ADD CONSTRAINT "FK_product_tags_products_product_id" FOREIGN KEY ("product_id") REFERENCES "catalogue"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogue"."product_tags" ADD CONSTRAINT "FK_product_tags_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "catalogue"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes"."quotes" ADD CONSTRAINT "FK_quotes_quote_requests_request_id" FOREIGN KEY ("request_id") REFERENCES "quotes"."quote_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes"."quote_draft_lines" ADD CONSTRAINT "FK_quote_draft_lines_quotes_quote_id" FOREIGN KEY ("quote_id") REFERENCES "quotes"."quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes"."quote_draft_price_components" ADD CONSTRAINT "FK_quote_draft_price_components_quotes_quote_id" FOREIGN KEY ("quote_id") REFERENCES "quotes"."quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes"."quote_versions" ADD CONSTRAINT "FK_quote_versions_quotes_quote_id" FOREIGN KEY ("quote_id") REFERENCES "quotes"."quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes"."quote_version_lines" ADD CONSTRAINT "FK_quote_version_lines_quote_versions_quote_version_id" FOREIGN KEY ("quote_version_id") REFERENCES "quotes"."quote_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes"."quote_version_price_components" ADD CONSTRAINT "FK_quote_version_price_components_quote_versions_quote_version_" FOREIGN KEY ("quote_version_id") REFERENCES "quotes"."quote_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments"."refunds" ADD CONSTRAINT "FK_refunds_payments_payment_id" FOREIGN KEY ("payment_id") REFERENCES "payments"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_access"."role_permissions" ADD CONSTRAINT "FK_role_permissions_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "identity_access"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_access"."role_permissions" ADD CONSTRAINT "FK_role_permissions_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "identity_access"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries_travel_planning"."travel_plan_destinations" ADD CONSTRAINT "FK_travel_plan_destinations_travel_plans_travel_plan_id" FOREIGN KEY ("travel_plan_id") REFERENCES "itineraries_travel_planning"."travel_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries_travel_planning"."travel_plan_interests" ADD CONSTRAINT "FK_travel_plan_interests_travel_plans_travel_plan_id" FOREIGN KEY ("travel_plan_id") REFERENCES "itineraries_travel_planning"."travel_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries_travel_planning"."travel_plan_preferences" ADD CONSTRAINT "FK_travel_plan_preferences_travel_plans_travel_plan_id" FOREIGN KEY ("travel_plan_id") REFERENCES "itineraries_travel_planning"."travel_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries_travel_planning"."travel_plan_travellers" ADD CONSTRAINT "FK_travel_plan_travellers_travel_plans_travel_plan_id" FOREIGN KEY ("travel_plan_id") REFERENCES "itineraries_travel_planning"."travel_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_access"."user_roles" ADD CONSTRAINT "FK_user_roles_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "identity_access"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_access"."user_roles" ADD CONSTRAINT "FK_user_roles_users_user_id" FOREIGN KEY ("user_id") REFERENCES "identity_access"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings"."vouchers" ADD CONSTRAINT "FK_vouchers_bookings_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve check constraints that Prisma cannot currently represent in its schema DSL.
ALTER TABLE "bookings"."bookings" ADD CONSTRAINT "ck_bookings_amounts" CHECK (total_amount >= 0 AND paid_amount >= 0 AND paid_amount <= total_amount + 0.01);
ALTER TABLE "bookings"."bookings" ADD CONSTRAINT "ck_bookings_currency" CHECK (currency IN ('EUR','GBP','LKR','USD'));
ALTER TABLE "bookings"."bookings" ADD CONSTRAINT "ck_bookings_dates" CHECK (travel_end_date >= travel_start_date);
ALTER TABLE "bookings"."bookings" ADD CONSTRAINT "ck_bookings_status" CHECK (status IN ('pending-confirmation','confirmed','partially-paid','paid','in-progress','completed','cancellation-requested','cancelled','refunded'));
ALTER TABLE "bookings"."booking_items" ADD CONSTRAINT "ck_booking_items_amounts" CHECK (unit_amount >= 0 AND line_total >= 0);
ALTER TABLE "bookings"."booking_items" ADD CONSTRAINT "ck_booking_items_quantity" CHECK (quantity > 0 AND quantity <= 1000);
ALTER TABLE "bookings"."invoices" ADD CONSTRAINT "ck_invoices_amounts" CHECK (subtotal >= 0 AND tax_total >= 0 AND grand_total >= 0);
ALTER TABLE "bookings"."invoices" ADD CONSTRAINT "ck_invoices_currency" CHECK (currency IN ('EUR','GBP','LKR','USD'));
ALTER TABLE "bookings"."invoices" ADD CONSTRAINT "ck_invoices_status" CHECK (status IN ('draft','issued','paid','void'));
ALTER TABLE "bookings"."vouchers" ADD CONSTRAINT "ck_vouchers_status" CHECK (status IN ('issued','redeemed','cancelled','expired'));
ALTER TABLE "bookings"."vouchers" ADD CONSTRAINT "ck_vouchers_validity" CHECK (valid_until >= valid_from);
ALTER TABLE "catalogue"."media_assets" ADD CONSTRAINT "ck_media_assets_height" CHECK (height > 0);
ALTER TABLE "catalogue"."media_assets" ADD CONSTRAINT "ck_media_assets_width" CHECK (width > 0);
ALTER TABLE "catalogue"."products" ADD CONSTRAINT "ck_products_currency" CHECK (char_length(currency) = 3);
ALTER TABLE "catalogue"."products" ADD CONSTRAINT "ck_products_duration" CHECK (duration_minutes IS NULL OR duration_minutes > 0);
ALTER TABLE "catalogue"."products" ADD CONSTRAINT "ck_products_starting_price" CHECK (starting_price IS NULL OR starting_price >= 0);
ALTER TABLE "catalogue"."product_media" ADD CONSTRAINT "ck_product_media_sort_order" CHECK (sort_order >= 0);
ALTER TABLE "customers_travellers"."saved_itineraries" ADD CONSTRAINT "ck_saved_itineraries_travel_dates" CHECK (travel_end_date IS NULL OR travel_start_date IS NULL OR travel_end_date >= travel_start_date);
ALTER TABLE "itineraries_travel_planning"."travel_plans" ADD CONSTRAINT "ck_travel_plans_dates" CHECK (travel_end_date >= travel_start_date AND travel_end_date - travel_start_date <= 29);
ALTER TABLE "payments"."payments" ADD CONSTRAINT "ck_payments_amount" CHECK (amount > 0 AND amount <= 99999999.99);
ALTER TABLE "payments"."payments" ADD CONSTRAINT "ck_payments_currency" CHECK (currency IN ('EUR','GBP','LKR','USD'));
ALTER TABLE "payments"."payments" ADD CONSTRAINT "ck_payments_gateway" CHECK (gateway IN ('stripe','local','manual'));
ALTER TABLE "payments"."payments" ADD CONSTRAINT "ck_payments_kind" CHECK (kind IN ('deposit','balance','manual-transfer','payment-link'));
ALTER TABLE "payments"."payments" ADD CONSTRAINT "ck_payments_reconciliation" CHECK (reconciliation_status IN ('unreconciled','reconciled','disputed'));
ALTER TABLE "payments"."payments" ADD CONSTRAINT "ck_payments_status" CHECK (status IN ('pending','authorised','captured','failed','refunded','cancelled'));
ALTER TABLE "payments"."payment_transactions" ADD CONSTRAINT "ck_payment_transactions_currency" CHECK (currency IN ('EUR','GBP','LKR','USD'));
ALTER TABLE "payments"."payment_transactions" ADD CONSTRAINT "ck_payment_transactions_gateway" CHECK (gateway IN ('stripe','local','manual'));
ALTER TABLE "payments"."refunds" ADD CONSTRAINT "ck_refunds_amount" CHECK (amount > 0 AND amount <= 99999999.99);
ALTER TABLE "payments"."refunds" ADD CONSTRAINT "ck_refunds_currency" CHECK (currency IN ('EUR','GBP','LKR','USD'));
ALTER TABLE "payments"."refunds" ADD CONSTRAINT "ck_refunds_status" CHECK (status IN ('pending','succeeded','failed'));
ALTER TABLE "quotes"."quotes" ADD CONSTRAINT "ck_quotes_currency" CHECK (currency IS NULL OR currency IN ('EUR','GBP','LKR','USD'));
ALTER TABLE "quotes"."quotes" ADD CONSTRAINT "ck_quotes_status" CHECK (status IN ('draft','sent','accepted','declined','expired','withdrawn'));
ALTER TABLE "quotes"."quote_draft_lines" ADD CONSTRAINT "ck_quote_draft_lines_quantity" CHECK (quantity > 0 AND quantity <= 1000);
ALTER TABLE "quotes"."quote_draft_lines" ADD CONSTRAINT "ck_quote_draft_lines_unit_amount" CHECK (unit_amount >= 0 AND unit_amount <= 99999999.99);
ALTER TABLE "quotes"."quote_draft_price_components" ADD CONSTRAINT "ck_quote_draft_components_amount" CHECK (amount >= -99999999.99 AND amount <= 99999999.99);
ALTER TABLE "quotes"."quote_draft_price_components" ADD CONSTRAINT "ck_quote_draft_components_kind" CHECK (kind IN ('tax','adjustment'));
ALTER TABLE "quotes"."quote_requests" ADD CONSTRAINT "ck_quote_requests_dates" CHECK (travel_end_date >= travel_start_date);
ALTER TABLE "quotes"."quote_versions" ADD CONSTRAINT "ck_quote_versions_currency" CHECK (currency IN ('EUR','GBP','LKR','USD'));
ALTER TABLE "quotes"."quote_versions" ADD CONSTRAINT "ck_quote_versions_expiry" CHECK (expires_at_utc > sent_at_utc);
ALTER TABLE "quotes"."quote_versions" ADD CONSTRAINT "ck_quote_versions_totals" CHECK (subtotal >= 0 AND tax_total >= 0 AND grand_total >= 0);
