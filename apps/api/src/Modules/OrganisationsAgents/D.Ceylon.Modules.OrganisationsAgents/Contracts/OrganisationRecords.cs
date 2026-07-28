namespace D.Ceylon.Modules.OrganisationsAgents.Contracts;

public interface IOrganisationRecords
{
    Task<bool> IsActiveAsync(Guid organisationId, CancellationToken cancellationToken);
}
