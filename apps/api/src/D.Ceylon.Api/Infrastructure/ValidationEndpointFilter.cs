using System.ComponentModel.DataAnnotations;

namespace D.Ceylon.Api.Infrastructure;

internal sealed class ValidationEndpointFilter<TRequest> : IEndpointFilter
    where TRequest : class
{
    public ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(next);

        var request = context.Arguments.OfType<TRequest>().SingleOrDefault();
        if (request is null)
        {
            return next(context);
        }

        var validationResults = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(
            request,
            new ValidationContext(request),
            validationResults,
            validateAllProperties: true);

        if (isValid)
        {
            return next(context);
        }

        var errors = validationResults
            .SelectMany(
                result => result.MemberNames.DefaultIfEmpty(string.Empty),
                (result, memberName) => new
                {
                    MemberName = string.IsNullOrWhiteSpace(memberName)
                        ? "request"
                        : char.ToLowerInvariant(memberName[0]) + memberName[1..],
                    Error = result.ErrorMessage ?? "The supplied value is invalid.",
                })
            .GroupBy(item => item.MemberName, StringComparer.Ordinal)
            .ToDictionary(
                group => group.Key,
                group => group.Select(item => item.Error).Distinct().ToArray(),
                StringComparer.Ordinal);

        return ValueTask.FromResult<object?>(TypedResults.ValidationProblem(errors));
    }
}
