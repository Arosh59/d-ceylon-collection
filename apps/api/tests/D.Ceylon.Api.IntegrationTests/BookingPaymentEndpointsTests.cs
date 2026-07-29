using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using D.Ceylon.Modules.IdentityAccess.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;

namespace D.Ceylon.Api.IntegrationTests;

public sealed class BookingPaymentEndpointsTests(ApiApplicationFactory factory)
    : IClassFixture<ApiApplicationFactory>
{
    private static readonly string[] EllaDestination = ["ella"];
    private static readonly string[] NatureInterest = ["nature"];
    private static readonly string[] ExperienceProductType = ["experience"];
    private static readonly string[] NatureCategory = ["nature"];
    private static readonly string[] SlowTravelTag = ["slow-travel"];

    private readonly ApiApplicationFactory _factory = factory;

    [Fact]
    public async Task AcceptedCurrentQuoteCreatesOwnerScopedBookingAndServerPricedPayment()
    {
        using var customer = await AuthenticatedClient("customer");
        var acceptedQuote = await CreateAcceptedQuote(customer);
        var quoteId = acceptedQuote.GetProperty("id").GetGuid();
        var versionId = acceptedQuote.GetProperty("currentVersionId").GetGuid();

        using var bookingResponse = await customer.PostAsJsonAsync(
            "/api/v1/customer/bookings",
            new { quoteId, quoteVersionId = versionId, customerNotes = "Please contact me by email." },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, bookingResponse.StatusCode);
        var booking = await Body(bookingResponse);
        var bookingId = booking.GetProperty("id").GetGuid();
        Assert.Equal("USD", booking.GetProperty("currency").GetString());
        Assert.Equal(1_345m, booking.GetProperty("totalAmount").GetDecimal());
        Assert.Equal(versionId, booking.GetProperty("quoteVersionId").GetGuid());
        Assert.Single(booking.GetProperty("invoices").EnumerateArray());

        using var paymentResponse = await customer.PostAsJsonAsync(
            $"/api/v1/customer/bookings/{bookingId}/payments",
            new
            {
                kind = "payment-link",
                gateway = "stripe",
                idempotencyKey = "phase9-payment-intent-0001",
            },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, paymentResponse.StatusCode);
        var payment = await Body(paymentResponse);
        Assert.Equal(bookingId, payment.GetProperty("bookingId").GetGuid());
        Assert.Equal("USD", payment.GetProperty("currency").GetString());
        Assert.Equal(1_345m, payment.GetProperty("amount").GetDecimal());
        Assert.False(payment.GetProperty("hasPaymentLink").GetBoolean());

        using var replay = await customer.PostAsJsonAsync(
            $"/api/v1/customer/bookings/{bookingId}/payments",
            new
            {
                kind = "payment-link",
                gateway = "stripe",
                idempotencyKey = "phase9-payment-intent-0001",
            },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, replay.StatusCode);

        using var payments = await customer.GetAsync(
            $"/api/v1/customer/bookings/{bookingId}/payments?pageNumber=1&pageSize=20",
            TestContext.Current.CancellationToken);
        payments.EnsureSuccessStatusCode();
        var paymentPage = await Body(payments);
        Assert.Equal(
            1,
            paymentPage.GetProperty("pagination").GetProperty("totalItems").GetInt64());

        using var agent = await AuthenticatedClient("agent");
        using var agentBookings = await agent.GetAsync(
            "/api/v1/agent/bookings?pageNumber=1&pageSize=20",
            TestContext.Current.CancellationToken);
        agentBookings.EnsureSuccessStatusCode();
        Assert.Contains(
            (await Body(agentBookings)).GetProperty("items").EnumerateArray(),
            item => item.GetProperty("id").GetGuid() == bookingId);

        await using var scope = _factory.Services.CreateAsyncScope();
        var audit = scope.ServiceProvider.GetRequiredService<IdentityAccessDbContext>();
        var events = await audit.SecurityAuditEvents.Select(item => item.EventType)
            .ToListAsync(TestContext.Current.CancellationToken);
        Assert.Contains("booking-created", events);
        Assert.Contains("payment-created", events);
    }

    [Fact]
    public async Task BookingAndPaymentRejectInvalidAndCrossCustomerAccessAndHaveIndexes()
    {
        using var anonymous = _factory.CreateClient();
        using var unauthorised = await anonymous.GetAsync(
            "/api/v1/customer/bookings", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorised.StatusCode);

        using var customer = await AuthenticatedClient("customer");
        using var invalid = await customer.PostAsJsonAsync(
            "/api/v1/customer/bookings",
            new { quoteId = Guid.Empty, quoteVersionId = Guid.Empty },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        var quote = await CreateAcceptedQuote(customer);
        using var created = await customer.PostAsJsonAsync(
            "/api/v1/customer/bookings",
            new
            {
                quoteId = quote.GetProperty("id").GetGuid(),
                quoteVersionId = quote.GetProperty("currentVersionId").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        created.EnsureSuccessStatusCode();
        var bookingId = (await Body(created)).GetProperty("id").GetGuid();

        using var other = await AuthenticatedClient("customer-other");
        using var crossBooking = await other.GetAsync(
            $"/api/v1/customer/bookings/{bookingId}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, crossBooking.StatusCode);
        using var crossPayment = await other.PostAsJsonAsync(
            $"/api/v1/customer/bookings/{bookingId}/payments",
            new { kind = "payment-link", gateway = "stripe", idempotencyKey = "phase9-other-customer-0001" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, crossPayment.StatusCode);

        await using var connection = new NpgsqlConnection(_factory.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT schemaname, indexname FROM pg_indexes
            WHERE schemaname IN ('bookings', 'payments')
            """;
        await using var reader = await command.ExecuteReaderAsync(TestContext.Current.CancellationToken);
        var indexes = new HashSet<string>();
        while (await reader.ReadAsync(TestContext.Current.CancellationToken))
            indexes.Add(reader.GetString(1));
        Assert.Contains("ux_bookings_quote", indexes);
        Assert.Contains("ix_bookings_customer_status_updated", indexes);
        Assert.Contains("ux_payments_idempotency_key", indexes);
        Assert.Contains("ix_payments_customer_booking_status", indexes);
    }

    private async Task<JsonElement> CreateAcceptedQuote(HttpClient customer)
    {
        using var planResponse = await customer.PostAsJsonAsync(
            "/api/v1/customer/travel-plans",
            new
            {
                title = $"Phase 9 booking draft {Guid.NewGuid():N}",
                travelStartDate = "2027-05-10",
                travelEndDate = "2027-05-12",
                pace = "balanced",
                destinationSlugs = EllaDestination,
                travellerIds = Array.Empty<Guid>(),
                interests = NatureInterest,
                productTypeSlugs = ExperienceProductType,
                categorySlugs = NatureCategory,
                tagSlugs = SlowTravelTag,
            },
            TestContext.Current.CancellationToken);
        planResponse.EnsureSuccessStatusCode();
        var plan = await Body(planResponse);
        using var quoteResponse = await customer.PostAsJsonAsync(
            "/api/v1/customer/quotes",
            new
            {
                travelPlanId = plan.GetProperty("id").GetGuid(),
                itineraryRevisionId = plan.GetProperty("currentRevision").GetProperty("id").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        quoteResponse.EnsureSuccessStatusCode();
        var quote = await Body(quoteResponse);
        var quoteId = quote.GetProperty("id").GetGuid();

        using var agent = await AuthenticatedClient("agent");
        using var prepare = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/prepare",
            new { currency = "USD", concurrencyToken = quote.GetProperty("concurrencyToken").GetGuid() },
            TestContext.Current.CancellationToken);
        prepare.EnsureSuccessStatusCode();
        var prepared = await Body(prepare);
        using var draft = await agent.PutAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/draft",
            new
            {
                currency = "USD",
                terms = "A quote is not a booking or payment confirmation.",
                lines = new[] { new { title = "Private journey", quantity = 1m, unitAmount = 1_250m } },
                components = new object[]
                {
                    new { kind = "tax", label = "Local taxes", amount = 100m },
                    new { kind = "adjustment", label = "Collection adjustment", amount = -5m },
                },
                concurrencyToken = prepared.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        draft.EnsureSuccessStatusCode();
        var updated = await Body(draft);
        using var sent = await agent.PostAsJsonAsync(
            $"/api/v1/agent/quotes/{quoteId}/send",
            new { expiresAtUtc = DateTimeOffset.UtcNow.AddDays(30), concurrencyToken = updated.GetProperty("concurrencyToken").GetGuid() },
            TestContext.Current.CancellationToken);
        sent.EnsureSuccessStatusCode();

        using var detail = await customer.GetAsync(
            $"/api/v1/customer/quotes/{quoteId}", TestContext.Current.CancellationToken);
        detail.EnsureSuccessStatusCode();
        var sentQuote = await Body(detail);
        using var accepted = await customer.PostAsJsonAsync(
            $"/api/v1/customer/quotes/{quoteId}/accept",
            new
            {
                versionId = sentQuote.GetProperty("currentVersionId").GetGuid(),
                concurrencyToken = sentQuote.GetProperty("concurrencyToken").GetGuid(),
            },
            TestContext.Current.CancellationToken);
        accepted.EnsureSuccessStatusCode();
        return await Body(accepted);
    }

    private async Task<HttpClient> AuthenticatedClient(string persona)
    {
        using var issuer = _factory.CreateClient();
        issuer.DefaultRequestHeaders.Add("X-Test-Authentication-Key", ApiApplicationFactory.TestEndpointKey);
        using var response = await issuer.PostAsJsonAsync(
            "/api/v1/access/testing/token", new { persona }, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var body = await Body(response);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", body.GetProperty("accessToken").GetString());
        return client;
    }

    private static async Task<JsonElement> Body(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
}
