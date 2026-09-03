import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "./auth.types";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  public use(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    const startedAt = performance.now();
    response.once("finish", () => {
      this.logger.log({
        event: "http.request.completed",
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        correlationId: request.correlationId,
      });
    });
    next();
  }
}
