using D.Ceylon.Modules.Editorial.Application;
using D.Ceylon.Modules.Editorial.Contracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace D.Ceylon.Modules.Editorial;

public static class EditorialModule
{
    public static IServiceCollection AddEditorialModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.Configure<DirectusEditorialOptions>(
            configuration.GetSection(DirectusEditorialOptions.SectionName));
        services.AddHttpClient(DirectusEditorialOptions.HttpClientName, (provider, client) =>
        {
            var options = provider.GetRequiredService<
                Microsoft.Extensions.Options.IOptions<DirectusEditorialOptions>>().Value;
            if (options.IsConfigured)
            {
                client.BaseAddress = new Uri(
                    $"{options.BaseUrl!.TrimEnd('/')}/",
                    UriKind.Absolute);
            }

            client.Timeout = TimeSpan.FromSeconds(5);
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        });
        services.AddScoped<IEditorialQueries, DirectusEditorialQueries>();
        return services;
    }
}

public sealed class DirectusEditorialOptions
{
    public const string HttpClientName = "DirectusEditorial";
    public const string SectionName = "Directus";

    public string? BaseUrl { get; init; }

    public string? StaticToken { get; init; }

    public bool IsConfigured => Uri.TryCreate(BaseUrl, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
        && string.IsNullOrEmpty(uri.UserInfo);
}
