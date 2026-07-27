using System.Text.RegularExpressions;

namespace D.Ceylon.Modules.Catalogue.Domain;

internal static partial class CatalogueGuard
{
    public static string Required(string value, int maximumLength, string parameterName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value, parameterName);

        var normalized = value.Trim();
        if (normalized.Length > maximumLength)
        {
            throw new ArgumentOutOfRangeException(
                parameterName,
                $"Value cannot exceed {maximumLength} characters.");
        }

        return normalized;
    }

    public static string Slug(string value, string parameterName)
    {
        var normalized = Required(value, 200, parameterName).ToLowerInvariant();
        if (!SlugPattern().IsMatch(normalized))
        {
            throw new ArgumentException(
                "Slugs may contain lowercase letters, numbers, and single hyphens only.",
                parameterName);
        }

        return normalized;
    }

    public static string Currency(string value, string parameterName)
    {
        var normalized = Required(value, 3, parameterName).ToUpperInvariant();
        if (normalized.Length != 3 || !normalized.All(character => character is >= 'A' and <= 'Z'))
        {
            throw new ArgumentException(
                "Currency must be a three-letter ISO-style code.",
                parameterName);
        }

        return normalized;
    }

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.CultureInvariant)]
    private static partial Regex SlugPattern();
}
