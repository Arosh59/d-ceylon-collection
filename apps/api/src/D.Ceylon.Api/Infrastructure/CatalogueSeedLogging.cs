using Microsoft.Extensions.Logging;

namespace D.Ceylon.Api.Infrastructure;

internal static partial class CatalogueSeedLogging
{
    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Information,
        Message = "Catalogue seed completed. Changed: {Changed}; Collections: {CollectionCount}; Destinations: {DestinationCount}; Products: {ProductCount}")]
    public static partial void Completed(
        ILogger logger,
        bool changed,
        int collectionCount,
        int destinationCount,
        int productCount);
}
