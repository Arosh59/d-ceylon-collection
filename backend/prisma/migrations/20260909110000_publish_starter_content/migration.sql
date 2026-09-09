-- Publish a small, non-destructive starter catalogue for fresh deployments.
-- Existing records always win: every insert is keyed by a stable public slug/asset key and
-- conflicts are ignored. No customer, identity, booking, or operational data is touched.

INSERT INTO "catalogue"."product_types"
    ("id", "concurrency_token", "created_at_utc", "updated_at_utc", "name", "slug")
VALUES
    ('10000000-0000-4000-8000-000000000101', gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Experience', 'experience'),
    ('10000000-0000-4000-8000-000000000102', gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Stay', 'accommodation')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "catalogue"."categories"
    ("id", "concurrency_token", "created_at_utc", "updated_at_utc", "name", "slug")
VALUES
    ('10000000-0000-4000-8000-000000000301', gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Culture', 'culture'),
    ('10000000-0000-4000-8000-000000000302', gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Nature', 'nature'),
    ('10000000-0000-4000-8000-000000000303', gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Coast', 'coast'),
    ('10000000-0000-4000-8000-000000000304', gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Wellbeing', 'wellbeing')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "catalogue"."tags"
    ("id", "concurrency_token", "created_at_utc", "updated_at_utc", "name", "slug")
VALUES
    ('10000000-0000-4000-8000-000000000401', gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Heritage', 'heritage'),
    ('10000000-0000-4000-8000-000000000402', gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Slow Travel', 'slow-travel'),
    ('10000000-0000-4000-8000-000000000403', gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Local Encounters', 'local-encounters')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "catalogue"."media_assets"
    ("id", "asset_key", "alt_text", "width", "height", "concurrency_token", "created_at_utc", "updated_at_utc")
VALUES
    ('10000000-0000-4000-8000-000000000801', 'placeholder:colombo', 'Colombo lake and city skyline', 900, 506, gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-4000-8000-000000000802', 'placeholder:ella', 'Green hill-country landscape near Ella', 495, 619, gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-4000-8000-000000000803', 'placeholder:galle', 'Historic Galle Fort beside the Indian Ocean', 1280, 720, gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-4000-8000-000000000804', 'placeholder:kandy', 'Kandy Lake and the Temple of the Tooth', 1920, 1080, gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-4000-8000-000000000805', 'placeholder:sigiriya', 'Sigiriya rock fortress rising above the forest', 495, 619, gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-4000-8000-000000000806', 'placeholder:tangalle', 'A quiet tropical beach near Tangalle', 678, 452, gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("asset_key") DO NOTHING;

INSERT INTO "catalogue"."destinations"
    ("id", "concurrency_token", "created_at_utc", "updated_at_utc", "name", "slug",
     "summary", "description", "publication_state", "hero_media_id", "latitude", "longitude",
     "district", "province")
SELECT seed.id::uuid, gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, seed.name, seed.slug,
       seed.summary, seed.description, 'Published', media.id, seed.latitude, seed.longitude,
       seed.district, seed.province
FROM (VALUES
    ('10000000-0000-4000-8000-000000000601', 'Colombo', 'colombo',
     'Sri Lanka''s coastal capital, read through design, food, history, and daily city life.',
     'Explore Colombo at a considered pace, from the lake and old civic quarter to independent makers and contemporary kitchens.',
     'placeholder:colombo', 6.927079::DECIMAL(9,6), 79.861244::DECIMAL(9,6), 'Colombo', 'Western'),
    ('10000000-0000-4000-8000-000000000602', 'Ella', 'ella',
     'Tea country, railway journeys, waterfalls, and generous highland views.',
     'Follow the railway into Ella for cool mornings, tea-country walks, and time among the southern highlands.',
     'placeholder:ella', 6.866698::DECIMAL(9,6), 81.046554::DECIMAL(9,6), 'Badulla', 'Uva'),
    ('10000000-0000-4000-8000-000000000603', 'Galle', 'galle',
     'A living fort city shaped by ocean trade, craft, and layered architecture.',
     'Look beyond the ramparts into Galle''s courtyards, workshops, coastal light, and enduring neighbourhood stories.',
     'placeholder:galle', 6.032894::DECIMAL(9,6), 80.216791::DECIMAL(9,6), 'Galle', 'Southern'),
    ('10000000-0000-4000-8000-000000000604', 'Kandy', 'kandy',
     'A cultural heartland of lake views, sacred traditions, gardens, and hill-country rhythm.',
     'Discover Kandy through its living traditions, botanical landscapes, and quieter viewpoints around the lake.',
     'placeholder:kandy', 7.290572::DECIMAL(9,6), 80.633726::DECIMAL(9,6), 'Kandy', 'Central'),
    ('10000000-0000-4000-8000-000000000605', 'Sigiriya', 'sigiriya',
     'Ancient rock, forest paths, village landscapes, and wide cultural-triangle horizons.',
     'Meet Sigiriya beyond the summit, with early starts, village routes, and space to understand the surrounding landscape.',
     'placeholder:sigiriya', 7.957032::DECIMAL(9,6), 80.760255::DECIMAL(9,6), 'Matale', 'Central'),
    ('10000000-0000-4000-8000-000000000606', 'Tangalle', 'tangalle',
     'Southern coves, long beaches, wetlands, and an unhurried coastal outlook.',
     'Settle into Sri Lanka''s deep south with calm shoreline days, lagoon nature, and carefully chosen local encounters.',
     'placeholder:tangalle', 6.024338::DECIMAL(9,6), 80.794073::DECIMAL(9,6), 'Hambantota', 'Southern')
) AS seed(id, name, slug, summary, description, asset_key, latitude, longitude, district, province)
JOIN "catalogue"."media_assets" media ON media."asset_key" = seed.asset_key
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "catalogue"."collections"
    ("id", "concurrency_token", "created_at_utc", "updated_at_utc", "name", "slug",
     "summary", "description", "publication_state", "hero_media_id")
SELECT seed.id::uuid, gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, seed.name, seed.slug,
       seed.summary, seed.description, 'Published', media.id
FROM (VALUES
    ('10000000-0000-4000-8000-000000000201', 'Root', 'root',
     'Journeys grounded in heritage, place, and living tradition.',
     'Travel through the island''s cultural foundations with people who keep its stories alive.', 'placeholder:kandy'),
    ('10000000-0000-4000-8000-000000000202', 'Flow', 'flow',
     'Railways, highlands, and routes that reward a slower pace.',
     'Let landscape and movement set the rhythm, with room for the journey between places.', 'placeholder:ella'),
    ('10000000-0000-4000-8000-000000000203', 'Awaken', 'awaken',
     'Early light, open landscapes, and experiences that sharpen the senses.',
     'Begin early and look closely at the island''s ancient and natural landmarks.', 'placeholder:sigiriya'),
    ('10000000-0000-4000-8000-000000000204', 'Breathe', 'breathe',
     'Restorative stays and spacious days beside forest, hill, and sea.',
     'Find considered places to pause, with wellbeing shaped by their surroundings.', 'placeholder:tangalle'),
    ('10000000-0000-4000-8000-000000000205', 'Rediscover', 'rediscover',
     'Familiar places approached through a fresh local perspective.',
     'Return to Sri Lanka''s best-known places through design, food, craft, and conversation.', 'placeholder:colombo')
) AS seed(id, name, slug, summary, description, asset_key)
JOIN "catalogue"."media_assets" media ON media."asset_key" = seed.asset_key
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "catalogue"."products"
    ("id", "concurrency_token", "created_at_utc", "updated_at_utc", "name", "slug",
     "short_description", "description", "product_type_id", "publication_state",
     "starting_price", "currency", "duration_minutes")
SELECT seed.id::uuid, gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, seed.name, seed.slug,
       seed.short_description, seed.description, product_type.id, 'Published', seed.starting_price,
       'USD', seed.duration_minutes
FROM (VALUES
    ('10000000-0000-4000-8000-000000000701', 'Colombo Design & Market Day', 'colombo-design-market-day', 'experience',
     'Meet independent makers and read the city through its markets and modernist edges.',
     'A privately guided introduction to Colombo through contemporary design, local food, civic history, and neighbourhood life.',
     110.00::DECIMAL(18,2), 360),
    ('10000000-0000-4000-8000-000000000702', 'Ella Tea Country Railway', 'ella-tea-country-railway', 'experience',
     'Travel by rail through tea country, then continue on foot into the highland landscape.',
     'A slow day shaped around the railway, working tea landscapes, short walks, and generous viewpoints near Ella.',
     95.00::DECIMAL(18,2), 420),
    ('10000000-0000-4000-8000-000000000703', 'Galle Fort Heritage Walk', 'galle-fort-heritage-walk', 'experience',
     'Explore the fort''s layered architecture and living neighbourhoods with a local storyteller.',
     'Walk beyond the familiar ramparts into courtyards, places of worship, workshops, and stories of Indian Ocean exchange.',
     70.00::DECIMAL(18,2), 180),
    ('10000000-0000-4000-8000-000000000704', 'Kandy Temple & Lake Day', 'kandy-temple-lake-day', 'experience',
     'Understand Kandy through sacred traditions, the lake, gardens, and hill-country viewpoints.',
     'A considered cultural day connecting the Temple of the Tooth with the city''s landscape and living traditions.',
     85.00::DECIMAL(18,2), 360),
    ('10000000-0000-4000-8000-000000000705', 'Sigiriya Rock & Village', 'sigiriya-rock-village', 'experience',
     'Climb in the cool early light and continue into the villages surrounding the ancient rock.',
     'An early Sigiriya ascent followed by a grounded introduction to the wider cultural landscape and village life.',
     120.00::DECIMAL(18,2), 420),
    ('10000000-0000-4000-8000-000000000706', 'Tangalle Coastal Retreat', 'tangalle-coastal-retreat', 'accommodation',
     'A quiet southern stay with ocean air, garden shade, and room to slow down.',
     'A carefully selected coastal base near Tangalle for spacious beach days and gentle exploration of the deep south.',
     210.00::DECIMAL(18,2), 1440),
    ('10000000-0000-4000-8000-000000000707', 'Ella Hillside Hideaway', 'ella-hillside-hideaway', 'accommodation',
     'A small highland stay overlooking tea slopes and mist-softened valleys.',
     'Wake above Ella with cool air, local breakfasts, and easy access to railway and walking routes.',
     175.00::DECIMAL(18,2), 1440),
    ('10000000-0000-4000-8000-000000000708', 'Galle Fort Courtyard Stay', 'galle-fort-courtyard-stay', 'accommodation',
     'A restored courtyard address inside the fort, close to its quieter lanes and ocean walls.',
     'Stay within Galle Fort in a characterful property selected for thoughtful restoration, comfort, and a strong sense of place.',
     240.00::DECIMAL(18,2), 1440)
) AS seed(id, name, slug, type_slug, short_description, description, starting_price, duration_minutes)
JOIN "catalogue"."product_types" product_type ON product_type."slug" = seed.type_slug
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "catalogue"."product_destinations" ("product_id", "destination_id")
SELECT product.id, destination.id
FROM (VALUES
    ('colombo-design-market-day', 'colombo'),
    ('ella-tea-country-railway', 'ella'),
    ('galle-fort-heritage-walk', 'galle'),
    ('kandy-temple-lake-day', 'kandy'),
    ('sigiriya-rock-village', 'sigiriya'),
    ('tangalle-coastal-retreat', 'tangalle'),
    ('ella-hillside-hideaway', 'ella'),
    ('galle-fort-courtyard-stay', 'galle')
) AS seed(product_slug, destination_slug)
JOIN "catalogue"."products" product ON product."slug" = seed.product_slug
JOIN "catalogue"."destinations" destination ON destination."slug" = seed.destination_slug
ON CONFLICT DO NOTHING;

INSERT INTO "catalogue"."product_collections" ("product_id", "collection_id")
SELECT product.id, collection.id
FROM (VALUES
    ('colombo-design-market-day', 'rediscover'),
    ('ella-tea-country-railway', 'flow'),
    ('galle-fort-heritage-walk', 'root'),
    ('kandy-temple-lake-day', 'root'),
    ('sigiriya-rock-village', 'awaken'),
    ('tangalle-coastal-retreat', 'breathe'),
    ('ella-hillside-hideaway', 'breathe'),
    ('galle-fort-courtyard-stay', 'rediscover')
) AS seed(product_slug, collection_slug)
JOIN "catalogue"."products" product ON product."slug" = seed.product_slug
JOIN "catalogue"."collections" collection ON collection."slug" = seed.collection_slug
ON CONFLICT DO NOTHING;

INSERT INTO "catalogue"."product_categories" ("product_id", "category_id")
SELECT product.id, category.id
FROM (VALUES
    ('colombo-design-market-day', 'culture'),
    ('ella-tea-country-railway', 'nature'),
    ('galle-fort-heritage-walk', 'culture'),
    ('kandy-temple-lake-day', 'culture'),
    ('sigiriya-rock-village', 'culture'),
    ('tangalle-coastal-retreat', 'coast'),
    ('ella-hillside-hideaway', 'wellbeing'),
    ('galle-fort-courtyard-stay', 'culture')
) AS seed(product_slug, category_slug)
JOIN "catalogue"."products" product ON product."slug" = seed.product_slug
JOIN "catalogue"."categories" category ON category."slug" = seed.category_slug
ON CONFLICT DO NOTHING;

INSERT INTO "catalogue"."product_tags" ("product_id", "tag_id")
SELECT product.id, tag.id
FROM (VALUES
    ('colombo-design-market-day', 'local-encounters'),
    ('ella-tea-country-railway', 'slow-travel'),
    ('galle-fort-heritage-walk', 'heritage'),
    ('kandy-temple-lake-day', 'heritage'),
    ('sigiriya-rock-village', 'heritage'),
    ('tangalle-coastal-retreat', 'slow-travel'),
    ('ella-hillside-hideaway', 'slow-travel'),
    ('galle-fort-courtyard-stay', 'heritage')
) AS seed(product_slug, tag_slug)
JOIN "catalogue"."products" product ON product."slug" = seed.product_slug
JOIN "catalogue"."tags" tag ON tag."slug" = seed.tag_slug
ON CONFLICT DO NOTHING;

INSERT INTO "catalogue"."product_media" ("product_id", "media_asset_id", "sort_order")
SELECT product.id, media.id, 0
FROM (VALUES
    ('colombo-design-market-day', 'placeholder:colombo'),
    ('ella-tea-country-railway', 'placeholder:ella'),
    ('galle-fort-heritage-walk', 'placeholder:galle'),
    ('kandy-temple-lake-day', 'placeholder:kandy'),
    ('sigiriya-rock-village', 'placeholder:sigiriya'),
    ('tangalle-coastal-retreat', 'placeholder:tangalle'),
    ('ella-hillside-hideaway', 'placeholder:ella'),
    ('galle-fort-courtyard-stay', 'placeholder:galle')
) AS seed(product_slug, asset_key)
JOIN "catalogue"."products" product ON product."slug" = seed.product_slug
JOIN "catalogue"."media_assets" media ON media."asset_key" = seed.asset_key
ON CONFLICT DO NOTHING;

INSERT INTO "editorial"."journal_articles"
    ("id", "status", "slug", "title", "summary", "content", "hero_image", "date_published",
     "created_at_utc", "updated_at_utc", "concurrency_token")
VALUES
    ('10000000-0000-4000-8000-000000000901', 'published', 'the-quiet-coast-at-dawn',
     'The quiet coast at dawn',
     'A slower way to meet Sri Lanka''s southern shoreline, before the day gathers pace.',
     'The southern coast is at its most revealing early in the morning. Fishing boats return, the light settles across long beaches, and village life begins beyond the main road. Start without a checklist. Walk, pause for tea, and let the character of each small bay emerge at its own pace.',
     '/images/editorial/coastline-dawn.webp', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, gen_random_uuid()),
    ('10000000-0000-4000-8000-000000000902', 'published', 'why-the-hill-country-railway-still-matters',
     'Why the hill-country railway still matters',
     'The celebrated train is more than a view; it is a thread through working highland communities.',
     'Take the hill-country railway for the movement between places rather than for a single photograph. Stations, tea estates, vegetable plots, and changing weather reveal a lived landscape. Choosing a shorter section and travelling outside the busiest hours leaves more room to notice it.',
     '/images/editorial/hill-country-railway.webp', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, gen_random_uuid()),
    ('10000000-0000-4000-8000-000000000903', 'published', 'kandy-beyond-the-first-impression',
     'Kandy beyond the first impression',
     'Look past a hurried temple visit and discover the city''s layered cultural landscape.',
     'Kandy rewards time and context. The lake, temple precinct, gardens, workshops, and surrounding hills are parts of one story. A locally guided morning followed by an unstructured afternoon offers a more generous introduction than rushing onward after the principal sights.',
     '/images/editorial/kandy-heritage.webp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, gen_random_uuid())
ON CONFLICT ("slug") DO NOTHING;
