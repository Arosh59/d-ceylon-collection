namespace D.Ceylon.Api.Middleware;

internal sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        context.Response.OnStarting(
            static state =>
            {
                var response = ((HttpContext)state).Response;
                response.Headers.XContentTypeOptions = "nosniff";
                response.Headers.XFrameOptions = "DENY";
                response.Headers["Referrer-Policy"] = "no-referrer";
                response.Headers.ContentSecurityPolicy =
                    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
                response.Headers.CacheControl = "no-store";
                return Task.CompletedTask;
            },
            context);

        return next(context);
    }
}
