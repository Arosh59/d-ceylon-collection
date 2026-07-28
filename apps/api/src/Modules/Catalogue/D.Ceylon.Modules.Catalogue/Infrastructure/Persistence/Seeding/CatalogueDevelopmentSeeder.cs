using D.Ceylon.Modules.Catalogue.Domain;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.Catalogue.Infrastructure.Persistence.Seeding;

public sealed class CatalogueDevelopmentSeeder(CatalogueDbContext database)
{
    public async Task<CatalogueSeedResult> SeedAsync(CancellationToken cancellationToken)
    {
        if (await database.Collections.AnyAsync(
                item => item.Id == Id(201),
                cancellationToken))
        {
            return new CatalogueSeedResult(false, 5, 6, 10);
        }

        var media = BuildMedia();
        var productTypes = new[]
        {
            new ProductType(Id(101), "Accommodation", "accommodation"),
            new ProductType(Id(102), "Experience", "experience"),
            new ProductType(Id(103), "Journey", "journey"),
        };
        var categories = new[]
        {
            new Category(Id(301), "Culture", "culture"),
            new Category(Id(302), "Nature", "nature"),
            new Category(Id(303), "Wellness", "wellness"),
            new Category(Id(304), "Coast", "coast"),
            new Category(Id(305), "Heritage", "heritage"),
        };
        var tags = new[]
        {
            new Tag(Id(401), "Mindful", "mindful"),
            new Tag(Id(402), "Culinary", "culinary"),
            new Tag(Id(403), "Active", "active"),
            new Tag(Id(404), "Slow travel", "slow-travel"),
            new Tag(Id(405), "Locally hosted", "locally-hosted"),
        };
        var collections = new[]
        {
            Published(new TravelCollectionEntry(
                Id(201),
                "Root",
                "root",
                "Travel closer to land, craft, and living heritage.",
                "Root follows the island's oldest stories through landscapes, communities, and thoughtful local encounters.",
                Id(501))),
            Published(new TravelCollectionEntry(
                Id(202),
                "Flow",
                "flow",
                "Move with the island's rhythms, from rail lines to quiet coves.",
                "Flow connects unhurried movement, changing landscapes, and stays designed around the natural pace of a place.",
                Id(502))),
            Published(new TravelCollectionEntry(
                Id(203),
                "Awaken",
                "awaken",
                "Meet early light, new perspectives, and restorative challenge.",
                "Awaken brings together experiences that sharpen the senses and create room for a fresh perspective.",
                Id(503))),
            Published(new TravelCollectionEntry(
                Id(204),
                "Breathe",
                "breathe",
                "Make space for stillness beside forest, hill, and sea.",
                "Breathe is a quieter path through Sri Lanka, with restorative stays and experiences grounded in wellbeing.",
                Id(504))),
            Published(new TravelCollectionEntry(
                Id(205),
                "Rediscover",
                "rediscover",
                "See familiar places through contemporary local eyes.",
                "Rediscover pairs living culture with independent makers, food stories, and unexpected corners of the island.",
                Id(505))),
        };
        var destinations = new[]
        {
            Published(new Destination(
                Id(601),
                "Colombo",
                "colombo",
                "A layered coastal capital shaped by food, design, and trade.",
                "Explore Colombo through independent studios, markets, neighbourhood tables, and its evolving waterfront.",
                Id(511))),
            Published(new Destination(
                Id(602),
                "Galle",
                "galle",
                "Fort walls, coastal light, and a living southern city.",
                "Galle balances layered maritime heritage with contemporary craft, food, and the wider southern coast.",
                Id(512))),
            Published(new Destination(
                Id(603),
                "Kandy",
                "kandy",
                "Hill-country ceremony, gardens, and forested horizons.",
                "Kandy is a cultural and geographic threshold, connecting sacred traditions with the central highlands.",
                Id(513))),
            Published(new Destination(
                Id(604),
                "Ella",
                "ella",
                "Tea slopes, cloud forest, and rail journeys in the highlands.",
                "Ella offers a gentle base for walking, estate stories, and slow days above the valleys.",
                Id(514))),
            Published(new Destination(
                Id(605),
                "Sigiriya",
                "sigiriya",
                "Rock country, ancient water gardens, and wide northern skies.",
                "Sigiriya anchors a landscape of living villages, forest paths, and exceptional archaeological heritage.",
                Id(515))),
            Published(new Destination(
                Id(606),
                "Tangalle",
                "tangalle",
                "Sheltered coves and a quieter stretch of the deep south.",
                "Tangalle brings together restorative coastal stays, lagoon landscapes, and uncrowded beaches.",
                Id(516))),
        };

        var products = BuildProducts();
        var typeBySlug = productTypes.ToDictionary(item => item.Slug);
        var categoryBySlug = categories.ToDictionary(item => item.Slug);
        var tagBySlug = tags.ToDictionary(item => item.Slug);
        var collectionBySlug = collections.ToDictionary(item => item.Slug);
        var destinationBySlug = destinations.ToDictionary(item => item.Slug);

        database.AddRange(media);
        database.AddRange(productTypes);
        database.AddRange(categories);
        database.AddRange(tags);
        database.AddRange(collections);
        database.AddRange(destinations);

        foreach (var seed in products)
        {
            var product = new Product(
                seed.Id,
                typeBySlug[seed.ProductType].Id,
                seed.Name,
                seed.Slug,
                seed.Summary,
                seed.Price,
                "USD",
                seed.DurationMinutes,
                seed.Description);
            product.Publish();
            database.Add(product);
            database.Add(new ProductMedia(product.Id, seed.MediaId, 0));
            database.AddRange(seed.Categories.Select(
                slug => new ProductCategory(product.Id, categoryBySlug[slug].Id)));
            database.AddRange(seed.Tags.Select(
                slug => new ProductTag(product.Id, tagBySlug[slug].Id)));
            database.AddRange(seed.Collections.Select(
                slug => new ProductCollectionLink(product.Id, collectionBySlug[slug].Id)));
            database.AddRange(seed.Destinations.Select(
                slug => new ProductDestination(product.Id, destinationBySlug[slug].Id)));
        }

        await database.SaveChangesAsync(cancellationToken);
        return new CatalogueSeedResult(true, collections.Length, destinations.Length, products.Count);
    }

    private static List<MediaAsset> BuildMedia()
    {
        var assets = new List<MediaAsset>
        {
            new(Id(501), "placeholder:root-earth", "Abstract earth and forest tones representing Root.", 1600, 1000),
            new(Id(502), "placeholder:flow-water", "Abstract water and sky tones representing Flow.", 1600, 1000),
            new(Id(503), "placeholder:awaken-sunrise", "Abstract sunrise tones representing Awaken.", 1600, 1000),
            new(Id(504), "placeholder:breathe-mist", "Abstract mist and foliage tones representing Breathe.", 1600, 1000),
            new(Id(505), "placeholder:rediscover-city", "Abstract warm city tones representing Rediscover.", 1600, 1000),
            new(Id(511), "placeholder:colombo", "Abstract coastal city placeholder for Colombo.", 1600, 1000),
            new(Id(512), "placeholder:galle", "Abstract fort and ocean placeholder for Galle.", 1600, 1000),
            new(Id(513), "placeholder:kandy", "Abstract lake and hill placeholder for Kandy.", 1600, 1000),
            new(Id(514), "placeholder:ella", "Abstract tea hill placeholder for Ella.", 1600, 1000),
            new(Id(515), "placeholder:sigiriya", "Abstract rock and sunrise placeholder for Sigiriya.", 1600, 1000),
            new(Id(516), "placeholder:tangalle", "Abstract cove and palms placeholder for Tangalle.", 1600, 1000),
        };

        var productMedia = BuildProducts();
        assets.AddRange(productMedia.Select(seed => new MediaAsset(
            seed.MediaId,
            $"placeholder:{seed.Slug}",
            $"Abstract editorial placeholder for {seed.Name}.",
            1600,
            1200)));
        return assets;
    }

    private static List<ProductSeed> BuildProducts() =>
    [
        new(Id(701), Id(801), "Tea Country Rail & Estate Walk", "tea-country-rail-estate-walk", "journey", "Ride the highland railway and walk an independent tea estate with a resident host.", "A slow rail-led journey between Kandy and Ella, pairing mountain views with an attentive introduction to tea landscapes and estate life.", 420, 480, ["nature", "culture"], ["slow-travel", "locally-hosted"], ["flow"], ["kandy", "ella"]),
        new(Id(702), Id(802), "Knuckles Dawn Hike", "knuckles-dawn-hike", "experience", "Enter the Knuckles foothills at first light with a local naturalist.", "A paced morning walk through changing forest and village landscapes, with breakfast prepared by a nearby family.", 95, 300, ["nature"], ["active", "locally-hosted"], ["root", "awaken"], ["kandy"]),
        new(Id(703), Id(803), "Sigiriya Sunrise Story", "sigiriya-sunrise-story", "experience", "Read Sigiriya's water gardens and rock landscape before the day gathers pace.", "An early guided interpretation of architecture, ecology, and courtly history, followed by a village breakfast.", 80, 210, ["heritage", "culture"], ["mindful", "locally-hosted"], ["awaken", "root"], ["sigiriya"]),
        new(Id(704), Id(804), "Southern Coast Breathwork", "southern-coast-breathwork", "experience", "Begin beside a sheltered southern cove with a gentle guided breath practice.", "A small-group coastal session designed around sunrise conditions, followed by herbal tea and time to settle by the water.", 55, 120, ["wellness", "coast"], ["mindful"], ["breathe"], ["tangalle"]),
        new(Id(705), Id(805), "Galle Fort Culinary Walk", "galle-fort-culinary-walk", "experience", "Taste the fort's layered food history through family kitchens and independent tables.", "A locally hosted walk connecting spice, migration, and maritime history through a considered sequence of tastings.", 75, 180, ["culture", "heritage"], ["culinary", "locally-hosted"], ["rediscover"], ["galle"]),
        new(Id(706), Id(806), "Colombo Design & Market Day", "colombo-design-market-day", "experience", "Meet independent makers and read the city through its markets and modernist edges.", "A flexible city day led by a Colombo-based creative, bringing together studios, street food, and overlooked architecture.", 110, 360, ["culture"], ["culinary", "locally-hosted"], ["rediscover"], ["colombo"]),
        new(Id(707), Id(807), "Ella Canopy Hideaway", "ella-canopy-hideaway", "accommodation", "A quiet highland stay looking into cloud forest beyond Ella.", "A small locally run hideaway with generous verandas, walking access, and a restorative relationship with the surrounding canopy.", 240, 1_440, ["nature", "wellness"], ["mindful", "slow-travel"], ["breathe"], ["ella"]),
        new(Id(708), Id(808), "Tangalle Cove Retreat", "tangalle-cove-retreat", "accommodation", "An intimate coastal stay set back from a sheltered Tangalle cove.", "A low-key retreat for unhurried beach days, lagoon exploration, and thoughtful seasonal cooking.", 285, 1_440, ["coast", "wellness"], ["slow-travel", "culinary"], ["flow", "breathe"], ["tangalle"]),
        new(Id(709), Id(809), "Cultural Triangle Slow Journey", "cultural-triangle-slow-journey", "journey", "Connect Sigiriya and Kandy through living heritage rather than a checklist.", "A multi-day foundation through the island's cultural heart, balancing landmark interpretation with villages, gardens, and time between.", 780, 4_320, ["heritage", "culture"], ["slow-travel", "locally-hosted"], ["root"], ["sigiriya", "kandy"]),
        new(Id(710), Id(810), "Hill Country Wellness Stay", "hill-country-wellness-stay", "accommodation", "A restorative Kandy base shaped by gardens, movement, and seasonal food.", "A private hill-country stay with guided morning practice and easy access to Kandy's cultural landscape.", 320, 1_440, ["wellness", "nature"], ["mindful", "culinary"], ["awaken"], ["kandy"]),
    ];

    private static T Published<T>(T item)
        where T : class
    {
        switch (item)
        {
            case TravelCollectionEntry collection:
                collection.Publish();
                break;
            case Destination destination:
                destination.Publish();
                break;
        }

        return item;
    }

    private static Guid Id(int value) =>
        Guid.Parse($"00000000-0000-0000-0000-{value:000000000000}");

    private sealed record ProductSeed(
        Guid Id,
        Guid MediaId,
        string Name,
        string Slug,
        string ProductType,
        string Summary,
        string Description,
        decimal Price,
        int DurationMinutes,
        string[] Categories,
        string[] Tags,
        string[] Collections,
        string[] Destinations);
}

public sealed record CatalogueSeedResult(
    bool Changed,
    int CollectionCount,
    int DestinationCount,
    int ProductCount);
