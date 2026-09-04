import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

interface WindowState {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly windows = new Map<string, WindowState>();

  public use(request: Request, response: Response, next: NextFunction): void {
    const limit =
      request.path === "/api/v1/access/testing/token"
        ? 10
        : request.path.startsWith("/api/v1/catalogue/")
          ? 120
          : undefined;
    if (!limit) return next();

    const now = Date.now();
    const key = `${request.ip ?? request.socket.remoteAddress ?? "unknown"}:${limit}`;
    const current = this.windows.get(key);
    const state =
      !current || current.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : current;
    state.count += 1;
    this.windows.set(key, state);
    if (state.count <= limit) return next();

    response.setHeader("Retry-After", Math.max(1, Math.ceil((state.resetAt - now) / 1000)));
    response
      .status(429)
      .type("application/problem+json")
      .send({
        type: "https://www.rfc-editor.org/rfc/rfc9110#name-429-too-many-requests",
        title: "Too many requests",
        status: 429,
        detail: "The request rate limit was exceeded. Try again later.",
        instance: request.path,
        correlationId: response.getHeader("X-Correlation-ID"),
      });
  }
}
