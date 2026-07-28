using D.Ceylon.Modules.OrganisationsAgents.Contracts;
using D.Ceylon.Modules.OrganisationsAgents.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace D.Ceylon.Modules.OrganisationsAgents.Application;

internal sealed class OrganisationRecords(OrganisationsAgentsDbContext database)
    : IOrganisationRecords
{
    public Task<bool> IsActiveAsync(
        Guid organisationId,
        CancellationToken cancellationToken) =>
        database.Organisations
            .AsNoTracking()
            .AnyAsync(
                organisation => organisation.Id == organisationId && organisation.IsActive,
                cancellationToken);
}
