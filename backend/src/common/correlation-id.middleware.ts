import { Injectable, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "./auth.types";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  public use(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    const supplied = request.header("X-Correlation-ID")?.trim();
    const correlationId =
      supplied && /^[A-Za-z0-9_.-]{1,64}$/u.test(supplied)
        ? supplied
        : randomUUID().replaceAll("-", "");
    request.correlationId = correlationId;
    response.setHeader("X-Correlation-ID", correlationId);
    next();
  }
}
