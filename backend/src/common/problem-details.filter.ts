import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

import type { AuthenticatedRequest } from "./auth.types";

export class DomainError extends Error {
  public constructor(
    public readonly status: number,
    message: string,
    public readonly title = "Request failed",
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ProblemDetailsFilter");

  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<AuthenticatedRequest>();
    const response = context.getResponse<Response>();
    const mapped = mapException(exception);
    if (mapped.status >= 500) {
      this.logger.error(
        {
          event: "http.request.failed",
          method: request.method,
          path: request.path,
          statusCode: mapped.status,
          correlationId: request.correlationId,
          error: exception instanceof Error ? exception.message : String(exception),
        },
        exception instanceof Error ? exception.stack : undefined,
      );
    }
    response
      .status(mapped.status)
      .type("application/problem+json")
      .send({
        type: `https://www.rfc-editor.org/rfc/rfc9110#name-${mapped.status}`,
        title: mapped.title,
        status: mapped.status,
        detail: mapped.detail,
        instance: request.path,
        correlationId: request.correlationId,
        ...(mapped.errors ? { errors: mapped.errors } : {}),
      });
  }
}

function mapException(exception: unknown): {
  status: number;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;
} {
  if (exception instanceof DomainError) {
    return {
      status: exception.status,
      title: exception.title,
      detail: exception.message,
      ...(exception.errors ? { errors: exception.errors } : {}),
    };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const body = exception.getResponse();
    const object = typeof body === "object" ? (body as Record<string, unknown>) : undefined;
    const messages = object?.message;
    return {
      status,
      title: status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : "Request failed",
      detail: Array.isArray(messages)
        ? messages.join(" ")
        : typeof messages === "string"
          ? messages
          : exception.message,
    };
  }
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    if (exception.code === "P2002") {
      return { status: 409, title: "Conflict", detail: "The record already exists." };
    }
    if (exception.code === "P2010" && String(exception.meta?.code) === "23505") {
      return { status: 409, title: "Conflict", detail: "The record already exists." };
    }
    if (exception.code === "P2025") {
      return { status: 404, title: "Not Found", detail: "The requested record was not found." };
    }
  }
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    title: "An unexpected error occurred",
    detail: "The server could not complete the request.",
  };
}
