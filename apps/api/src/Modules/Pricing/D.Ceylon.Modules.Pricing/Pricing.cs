namespace D.Ceylon.Modules.Pricing;

public static class CurrencyRules
{
    private static readonly HashSet<string> Supported =
        new(["EUR", "GBP", "LKR", "USD"], StringComparer.Ordinal);

    public static IReadOnlyList<string> SupportedCurrencies { get; } =
        Supported.Order(StringComparer.Ordinal).ToArray();

    public static string RequireSupported(string currency)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(currency);
        var normalized = currency.Trim().ToUpperInvariant();
        if (!Supported.Contains(normalized))
        {
            throw new PricingValidationException(
                $"Currency must be one of: {string.Join(", ", SupportedCurrencies)}.");
        }

        return normalized;
    }
}

public sealed record PriceLineInput(decimal Quantity, decimal UnitAmount);

public sealed record PriceComponentInput(string Kind, decimal Amount);

public sealed record PriceTotals(
    decimal Subtotal,
    decimal TaxTotal,
    decimal AdjustmentTotal,
    decimal GrandTotal);

public interface IPriceCalculator
{
    PriceTotals Calculate(
        IReadOnlyList<PriceLineInput> lines,
        IReadOnlyList<PriceComponentInput> components);
}

public sealed class PriceCalculator : IPriceCalculator
{
    public const decimal MaximumAmount = 99_999_999.99m;

    public PriceTotals Calculate(
        IReadOnlyList<PriceLineInput> lines,
        IReadOnlyList<PriceComponentInput> components)
    {
        ArgumentNullException.ThrowIfNull(lines);
        ArgumentNullException.ThrowIfNull(components);
        if (lines.Count is < 1 or > 100)
        {
            throw new PricingValidationException("A quote requires 1 to 100 line items.");
        }

        decimal subtotal = 0;
        foreach (var line in lines)
        {
            if (line.Quantity is <= 0 or > 1_000)
            {
                throw new PricingValidationException(
                    "Line quantities must be greater than zero and no more than 1,000.");
            }

            ValidateAmount(line.UnitAmount, allowNegative: false);
            subtotal = AddChecked(
                subtotal,
                Round(line.Quantity * line.UnitAmount),
                "The quote subtotal exceeds the supported limit.");
        }

        decimal taxes = 0;
        decimal adjustments = 0;
        foreach (var component in components)
        {
            var kind = component.Kind.Trim().ToLowerInvariant();
            if (kind is not ("tax" or "adjustment"))
            {
                throw new PricingValidationException(
                    "Price component kind must be tax or adjustment.");
            }

            ValidateAmount(component.Amount, allowNegative: kind == "adjustment");
            if (kind == "tax")
            {
                taxes = AddChecked(
                    taxes,
                    Round(component.Amount),
                    "The quote tax total exceeds the supported limit.");
            }
            else
            {
                adjustments = AddChecked(
                    adjustments,
                    Round(component.Amount),
                    "The quote adjustment total exceeds the supported limit.");
            }
        }

        var total = Round(subtotal + taxes + adjustments);
        if (total is < 0 or > MaximumAmount)
        {
            throw new PricingValidationException(
                "The quote grand total must be between zero and the supported limit.");
        }

        return new(Round(subtotal), Round(taxes), Round(adjustments), total);
    }

    public static decimal Round(decimal amount) =>
        decimal.Round(amount, 2, MidpointRounding.ToEven);

    private static void ValidateAmount(decimal amount, bool allowNegative)
    {
        if ((!allowNegative && amount < 0)
            || amount < -MaximumAmount
            || amount > MaximumAmount)
        {
            throw new PricingValidationException(
                "Monetary amounts are outside the supported fixed-precision range.");
        }

        if (amount != Round(amount))
        {
            throw new PricingValidationException(
                "Monetary amounts support at most two decimal places.");
        }
    }

    private static decimal AddChecked(decimal left, decimal right, string message)
    {
        var result = left + right;
        if (result is < -MaximumAmount or > MaximumAmount)
        {
            throw new PricingValidationException(message);
        }

        return result;
    }
}

public sealed class PricingValidationException(string message) : Exception(message);
