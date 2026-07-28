using System.ComponentModel.DataAnnotations;
using D.Ceylon.Modules.Pricing;
using D.Ceylon.Modules.Quotes.Contracts;
using D.Ceylon.Modules.Quotes.Domain;
using Xunit;

namespace D.Ceylon.Api.UnitTests;

public sealed class QuotePricingTests
{
    [Fact]
    public void PricingArithmeticIsDeterministicAndBankersRounded()
    {
        var calculator = new PriceCalculator();

        var first = calculator.Calculate(
            [new(1.25m, 10.10m), new(2m, 5.00m)],
            [new("tax", 1.01m), new("adjustment", -0.63m)]);
        var second = calculator.Calculate(
            [new(1.25m, 10.10m), new(2m, 5.00m)],
            [new("tax", 1.01m), new("adjustment", -0.63m)]);

        Assert.Equal(first, second);
        Assert.Equal(22.62m, first.Subtotal);
        Assert.Equal(1.01m, first.TaxTotal);
        Assert.Equal(-0.63m, first.AdjustmentTotal);
        Assert.Equal(23.00m, first.GrandTotal);
    }

    [Theory]
    [InlineData("EUR", "EUR")]
    [InlineData("gbp", "GBP")]
    [InlineData(" LKR ", "LKR")]
    [InlineData("USD", "USD")]
    public void SupportedCurrenciesAreNormalized(string input, string expected) =>
        Assert.Equal(expected, CurrencyRules.RequireSupported(input));

    [Fact]
    public void UnsupportedCurrencyAndInvalidPrecisionAreRejected()
    {
        var calculator = new PriceCalculator();

        Assert.Throws<PricingValidationException>(() =>
            CurrencyRules.RequireSupported("BTC"));
        Assert.Throws<PricingValidationException>(() =>
            calculator.Calculate([new(1m, 10.001m)], []));
    }

    [Fact]
    public void SentVersionsRemainUnchangedWhenADraftIsRevised()
    {
        var quote = Quote();
        quote.Prepare(Guid.NewGuid(), "USD");
        quote.ReplaceDraft(Draft("First service", 100m));
        var calculator = new PriceCalculator();
        var firstTotals = calculator.Calculate([new(1m, 100m)], [new("tax", 10m)]);
        var first = quote.Send(
            new DateTimeOffset(2027, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2027, 1, 31, 0, 0, 0, TimeSpan.Zero),
            "agent-subject",
            firstTotals);

        quote.Revise();
        quote.ReplaceDraft(Draft("Revised service", 150m));
        var secondTotals = calculator.Calculate([new(1m, 150m)], [new("tax", 10m)]);
        var second = quote.Send(
            new DateTimeOffset(2027, 1, 2, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2027, 2, 1, 0, 0, 0, TimeSpan.Zero),
            "agent-subject",
            secondTotals);

        Assert.Equal(2, quote.Versions.Count);
        Assert.Equal(100m, first.Lines.Single().UnitAmount);
        Assert.Equal("First service", first.Lines.Single().Title);
        Assert.Equal(110m, first.GrandTotal);
        Assert.Equal(150m, second.Lines.Single().UnitAmount);
        Assert.Equal(160m, second.GrandTotal);
    }

    [Fact]
    public void StateTransitionsAndExpiryAreExplicit()
    {
        var quote = Quote();
        quote.Prepare(Guid.NewGuid(), "USD");
        quote.ReplaceDraft(Draft("Service", 100m));
        var sentAt = new DateTimeOffset(2027, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var version = quote.Send(
            sentAt,
            sentAt.AddDays(10),
            "agent-subject",
            new PriceCalculator().Calculate(
                [new(1m, 100m)],
                [new("tax", 10m)]));

        quote.Accept(version.Id, sentAt.AddDays(1));
        Assert.Equal(QuoteStatuses.Accepted, quote.Status);
        Assert.Throws<QuoteTransitionException>(() => quote.Withdraw());

        var expiring = Quote();
        expiring.Prepare(Guid.NewGuid(), "USD");
        expiring.ReplaceDraft(Draft("Service", 100m));
        var expiringVersion = expiring.Send(
            sentAt,
            sentAt.AddDays(1),
            "agent-subject",
            new PriceCalculator().Calculate([new(1m, 100m)], []));
        Assert.True(expiring.ExpireIfNeeded(sentAt.AddDays(2)));
        Assert.Equal(QuoteStatuses.Expired, expiring.Status);
        Assert.Throws<QuoteTransitionException>(() =>
            expiring.Accept(expiringVersion.Id, sentAt.AddDays(2)));
    }

    [Fact]
    public void QuoteDraftValidationRejectsInvalidMoneyAndLists()
    {
        var request = Draft("", 10.001m);
        var results = new List<ValidationResult>();

        Validator.TryValidateObject(
            request,
            new ValidationContext(request),
            results,
            validateAllProperties: true);

        Assert.Contains(results, result => result.MemberNames.Contains(nameof(request.Lines)));
    }

    [Fact]
    public void DraftAndSentQuotesCanBeWithdrawnButAcceptedQuotesCannot()
    {
        var draft = Quote();
        draft.Withdraw();
        Assert.Equal(QuoteStatuses.Withdrawn, draft.Status);

        var sent = Quote();
        sent.Prepare(Guid.NewGuid(), "USD");
        sent.ReplaceDraft(Draft("Service", 100m));
        var sentAt = new DateTimeOffset(2027, 1, 1, 0, 0, 0, TimeSpan.Zero);
        sent.Send(
            sentAt,
            sentAt.AddDays(10),
            "agent-subject",
            new PriceCalculator().Calculate([new(1m, 100m)], []));
        sent.Withdraw();
        Assert.Equal(QuoteStatuses.Withdrawn, sent.Status);
    }

    private static Quote Quote()
    {
        var request = new QuoteRequest(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            1,
            "Reviewed Ella draft",
            new DateOnly(2027, 1, 1),
            new DateOnly(2027, 1, 5),
            "dceylon-deterministic-v1",
            new string('a', 64),
            "Please quote this reviewed draft.");
        return new Quote(Guid.NewGuid(), request);
    }

    private static UpdateAgentQuoteDraftRequest Draft(string title, decimal amount) =>
        new()
        {
            Currency = "USD",
            Assumptions = ["Subject to supplier confirmation."],
            Inclusions = ["Private transfers."],
            Exclusions = ["International flights."],
            Terms = "This quote is not a booking confirmation.",
            InternalNotes = "Agent-only preparation note.",
            Lines =
            [
                new QuoteLineInput
                {
                    Title = title,
                    Quantity = 1m,
                    UnitAmount = amount,
                },
            ],
            Components =
            [
                new QuotePriceComponentInput
                {
                    Kind = "tax",
                    Label = "Tax",
                    Amount = 10m,
                },
            ],
            ConcurrencyToken = Guid.NewGuid(),
        };
}
