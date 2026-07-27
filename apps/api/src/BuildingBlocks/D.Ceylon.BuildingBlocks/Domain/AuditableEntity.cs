namespace D.Ceylon.BuildingBlocks.Domain;

public abstract class AuditableEntity
{
    protected AuditableEntity()
    {
    }

    protected AuditableEntity(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Entity identifiers cannot be empty.", nameof(id));
        }

        Id = id;
        ConcurrencyToken = Guid.NewGuid();
    }

    public Guid Id { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; private set; }

    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public Guid ConcurrencyToken { get; private set; }
}
