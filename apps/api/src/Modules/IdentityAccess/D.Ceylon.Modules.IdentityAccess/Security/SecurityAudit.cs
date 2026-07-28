using D.Ceylon.Modules.IdentityAccess.Domain;
using D.Ceylon.Modules.IdentityAccess.Infrastructure.Persistence;

namespace D.Ceylon.Modules.IdentityAccess.Security;

public interface ISecurityAuditWriter
{
    Task RecordAsync(
        string eventType,
        string outcome,
        string? subject,
        string correlationId,
        CancellationToken cancellationToken);
}

internal sealed class SecurityAuditWriter(
    IdentityAccessDbContext database,
    TimeProvider timeProvider)
    : ISecurityAuditWriter
{
    public async Task RecordAsync(
        string eventType,
        string outcome,
        string? subject,
        string correlationId,
        CancellationToken cancellationToken)
    {
        database.SecurityAuditEvents.Add(
            new SecurityAuditEvent(
                Guid.NewGuid(),
                eventType,
                outcome,
                subject,
                correlationId,
                timeProvider.GetUtcNow()));
        await database.SaveChangesAsync(cancellationToken);
    }
}
