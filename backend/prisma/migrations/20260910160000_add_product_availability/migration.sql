CREATE TABLE "catalogue"."product_booking_profiles" (
    "product_id" UUID NOT NULL,
    "booking_mode" VARCHAR(20) NOT NULL DEFAULT 'request',
    "pricing_unit" VARCHAR(30) NOT NULL DEFAULT 'person',
    "time_zone" VARCHAR(80) NOT NULL DEFAULT 'Asia/Colombo',
    "meeting_point" VARCHAR(500),
    "pickup_available" BOOLEAN NOT NULL DEFAULT FALSE,
    "pickup_instructions" VARCHAR(1000),
    "languages" VARCHAR(80)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(80)[],
    "minimum_age" INTEGER,
    "maximum_group_size" INTEGER,
    "accessibility_information" VARCHAR(2000),
    "inclusions" VARCHAR(500)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(500)[],
    "exclusions" VARCHAR(500)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(500)[],
    "what_to_bring" VARCHAR(500)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(500)[],
    "important_information" VARCHAR(500)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(500)[],
    "cancellation_policy" VARCHAR(4000),
    "weather_policy" VARCHAR(2000),
    "instant_confirmation" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concurrency_token" UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT "PK_product_booking_profiles" PRIMARY KEY ("product_id"),
    CONSTRAINT "ck_product_booking_profiles_booking_mode" CHECK ("booking_mode" IN ('instant', 'request')),
    CONSTRAINT "ck_product_booking_profiles_pricing_unit" CHECK ("pricing_unit" IN ('person', 'group', 'night', 'room')),
    CONSTRAINT "ck_product_booking_profiles_minimum_age" CHECK ("minimum_age" IS NULL OR "minimum_age" BETWEEN 0 AND 120),
    CONSTRAINT "ck_product_booking_profiles_maximum_group_size" CHECK ("maximum_group_size" IS NULL OR "maximum_group_size" > 0),
    CONSTRAINT "FK_product_booking_profiles_products_product_id" FOREIGN KEY ("product_id") REFERENCES "catalogue"."products"("id") ON DELETE CASCADE
);

CREATE INDEX "ix_product_booking_profiles_booking_mode"
ON "catalogue"."product_booking_profiles"("booking_mode");

CREATE TABLE "bookings"."experience_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "starts_at_utc" TIMESTAMPTZ(6) NOT NULL,
    "ends_at_utc" TIMESTAMPTZ(6),
    "capacity" INTEGER NOT NULL,
    "reserved_capacity" INTEGER NOT NULL DEFAULT 0,
    "minimum_participants" INTEGER NOT NULL DEFAULT 1,
    "price_override" DECIMAL(18,2),
    "currency" CHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "booking_cutoff_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concurrency_token" UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT "PK_experience_slots" PRIMARY KEY ("id"),
    CONSTRAINT "ck_experience_slots_capacity" CHECK ("capacity" > 0),
    CONSTRAINT "ck_experience_slots_reserved_capacity" CHECK ("reserved_capacity" BETWEEN 0 AND "capacity"),
    CONSTRAINT "ck_experience_slots_minimum_participants" CHECK ("minimum_participants" BETWEEN 1 AND "capacity"),
    CONSTRAINT "ck_experience_slots_end" CHECK ("ends_at_utc" IS NULL OR "ends_at_utc" > "starts_at_utc"),
    CONSTRAINT "ck_experience_slots_price" CHECK ("price_override" IS NULL OR "price_override" >= 0),
    CONSTRAINT "ck_experience_slots_currency" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "ck_experience_slots_status" CHECK ("status" IN ('open', 'closed')),
    CONSTRAINT "ck_experience_slots_cutoff" CHECK ("booking_cutoff_minutes" >= 0),
    CONSTRAINT "FK_experience_slots_products_product_id" FOREIGN KEY ("product_id") REFERENCES "catalogue"."products"("id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "ux_experience_slots_product_start"
ON "bookings"."experience_slots"("product_id", "starts_at_utc");
CREATE INDEX "ix_experience_slots_product_status_start"
ON "bookings"."experience_slots"("product_id", "status", "starts_at_utc");

CREATE TABLE "catalogue"."room_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "description" VARCHAR(2000),
    "maximum_adults" INTEGER NOT NULL,
    "maximum_children" INTEGER NOT NULL DEFAULT 0,
    "room_quantity" INTEGER NOT NULL,
    "beds" VARCHAR(300),
    "bathrooms" INTEGER NOT NULL DEFAULT 1,
    "amenities" VARCHAR(160)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(160)[],
    "meal_plan" VARCHAR(160),
    "base_price" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "cancellation_policy" VARCHAR(4000),
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concurrency_token" UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT "PK_room_types" PRIMARY KEY ("id"),
    CONSTRAINT "ck_room_types_slug" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    CONSTRAINT "ck_room_types_maximum_adults" CHECK ("maximum_adults" > 0),
    CONSTRAINT "ck_room_types_maximum_children" CHECK ("maximum_children" >= 0),
    CONSTRAINT "ck_room_types_room_quantity" CHECK ("room_quantity" > 0),
    CONSTRAINT "ck_room_types_bathrooms" CHECK ("bathrooms" >= 0),
    CONSTRAINT "ck_room_types_base_price" CHECK ("base_price" >= 0),
    CONSTRAINT "ck_room_types_currency" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "FK_room_types_products_product_id" FOREIGN KEY ("product_id") REFERENCES "catalogue"."products"("id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "ux_room_types_product_slug"
ON "catalogue"."room_types"("product_id", "slug");
CREATE INDEX "ix_room_types_product_active_name"
ON "catalogue"."room_types"("product_id", "is_active", "name");

CREATE TABLE "bookings"."room_night_inventory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_type_id" UUID NOT NULL,
    "stay_date" DATE NOT NULL,
    "capacity" INTEGER NOT NULL,
    "reserved_capacity" INTEGER NOT NULL DEFAULT 0,
    "price_override" DECIMAL(18,2),
    "minimum_stay_nights" INTEGER NOT NULL DEFAULT 1,
    "is_closed" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at_utc" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concurrency_token" UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT "PK_room_night_inventory" PRIMARY KEY ("id"),
    CONSTRAINT "ck_room_night_inventory_capacity" CHECK ("capacity" > 0),
    CONSTRAINT "ck_room_night_inventory_reserved_capacity" CHECK ("reserved_capacity" BETWEEN 0 AND "capacity"),
    CONSTRAINT "ck_room_night_inventory_price" CHECK ("price_override" IS NULL OR "price_override" >= 0),
    CONSTRAINT "ck_room_night_inventory_minimum_stay" CHECK ("minimum_stay_nights" > 0),
    CONSTRAINT "FK_room_night_inventory_room_types_room_type_id" FOREIGN KEY ("room_type_id") REFERENCES "catalogue"."room_types"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "ux_room_night_inventory_room_date"
ON "bookings"."room_night_inventory"("room_type_id", "stay_date");
CREATE INDEX "ix_room_night_inventory_date_closed"
ON "bookings"."room_night_inventory"("stay_date", "is_closed");
