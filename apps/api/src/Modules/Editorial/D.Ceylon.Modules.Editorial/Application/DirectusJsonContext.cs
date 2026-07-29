using System.Text.Json.Serialization;

namespace D.Ceylon.Modules.Editorial.Application;

[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.SnakeCaseLower)]
[JsonSerializable(typeof(DirectusList<DirectusJournalArticle>))]
[JsonSerializable(typeof(DirectusList<DirectusPromotion>))]
internal sealed partial class DirectusJsonContext : JsonSerializerContext;
