ALTER TABLE "catalogue"."destinations"
ADD COLUMN "latitude" DECIMAL(9, 6),
ADD COLUMN "longitude" DECIMAL(9, 6),
ADD COLUMN "district" VARCHAR(120),
ADD COLUMN "province" VARCHAR(120);

ALTER TABLE "catalogue"."destinations"
ADD CONSTRAINT "ck_destinations_coordinates_pair"
CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL)),
ADD CONSTRAINT "ck_destinations_latitude"
CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
ADD CONSTRAINT "ck_destinations_longitude"
CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);

UPDATE "catalogue"."destinations"
SET "latitude" = location.latitude,
    "longitude" = location.longitude,
    "district" = location.district,
    "province" = location.province
FROM (VALUES
  ('colombo', 6.927079::DECIMAL(9, 6), 79.861244::DECIMAL(9, 6), 'Colombo', 'Western'),
  ('ella', 6.866698::DECIMAL(9, 6), 81.046554::DECIMAL(9, 6), 'Badulla', 'Uva'),
  ('galle', 6.032894::DECIMAL(9, 6), 80.216791::DECIMAL(9, 6), 'Galle', 'Southern'),
  ('kandy', 7.290572::DECIMAL(9, 6), 80.633726::DECIMAL(9, 6), 'Kandy', 'Central'),
  ('sigiriya', 7.957032::DECIMAL(9, 6), 80.760255::DECIMAL(9, 6), 'Matale', 'Central'),
  ('tangalle', 6.024338::DECIMAL(9, 6), 80.794073::DECIMAL(9, 6), 'Hambantota', 'Southern')
) AS location(slug, latitude, longitude, district, province)
WHERE "destinations"."slug" = location.slug;
