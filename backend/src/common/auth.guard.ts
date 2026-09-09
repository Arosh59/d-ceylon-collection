import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { jwtVerify, type JWTPayload } from "jose";

import { SecurityAuditService } from "../database/security-audit.service";
import { ApplicationJwtService } from "../modules/auth/application-jwt.service";
import { AuthService } from "../modules/auth/auth.service";
import { ALLOW_PASSWORD_CHANGE_REQUIRED, IS_PUBLIC, REQUIRED_ROLES } from "./auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "./auth.types";

@Injectable()
export class AuthGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly jwt: ApplicationJwtService,
    private readonly auth: AuthService,
    private readonly audit: SecurityAuditService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      await this.recordAuthentication(request, "missing-token");
      throw new UnauthorizedException("Authentication is required.");
    }

    let payload: JWTPayload;
    try {
      payload = await this.verify(authorization.slice(7));
    } catch {
      await this.recordAuthentication(request, "invalid-token");
      throw new UnauthorizedException("The bearer token is invalid or expired.");
    }

    for (const required of ["sub", "jti", "iat"] as const) {
      if (payload[required] === undefined) {
        throw new UnauthorizedException(`The bearer token is missing ${required}.`);
      }
    }

    const user = await this.currentUser(payload);
    request.user = user;

    const allowPasswordChangeRequired = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PASSWORD_CHANGE_REQUIRED,
      [context.getHandler(), context.getClass()],
    );
    if (user.mustChangePassword && !allowPasswordChangeRequired) {
      await this.recordAuthentication(request, "password-change-required", user.subject);
      throw new ForbiddenException("The temporary password must be replaced before continuing.");
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles?.length && !requiredRoles.some((role) => user.roles.includes(role))) {
      await this.recordAuthentication(request, "forbidden-role", user.subject);
      throw new ForbiddenException("The authenticated identity does not have the required role.");
    }
    await this.recordAuthentication(request, "succeeded", user.subject);
    return true;
  }

  private async verify(token: string): Promise<JWTPayload> {
    const testing = this.config.get<string>("APP_ENVIRONMENT") === "Testing";
    if (!testing) return this.jwt.verify(token);
    const secret = new TextEncoder().encode(
      this.config.getOrThrow<string>("AUTH_TEST_SIGNING_KEY"),
    );
    return (
      await jwtVerify(token, secret, {
        issuer: this.config.getOrThrow<string>("AUTH_TEST_ISSUER"),
        audience: this.config.getOrThrow<string>("AUTH_TEST_AUDIENCE"),
        algorithms: ["HS256"],
      })
    ).payload;
  }

  private async currentUser(payload: JWTPayload): Promise<AuthenticatedUser> {
    if (this.config.get<string>("APP_ENVIRONMENT") === "Testing") {
      return userFromClaims(payload);
    }
    const sessionId = stringClaim(payload.sid);
    if (!sessionId) throw new UnauthorizedException("The bearer token is missing sid.");
    await this.auth.assertActiveSession(payload.sub!, sessionId);
    const identity = await this.auth.identity(payload.sub!);
    return {
      subject: identity.subject,
      displayName: identity.displayName,
      roles: identity.roles,
      permissions: identity.permissions,
      mustChangePassword: identity.mustChangePassword,
      claims: payload as Record<string, unknown>,
      ...(identity.email ? { email: identity.email } : {}),
      ...(identity.customerId ? { customerId: identity.customerId } : {}),
      ...(identity.organisationId ? { organisationId: identity.organisationId } : {}),
    };
  }

  private async recordAuthentication(
    request: AuthenticatedRequest,
    outcome: string,
    subject: string | null = null,
  ): Promise<void> {
    try {
      await this.audit.record("authenticate", outcome, subject, request.correlationId ?? "unknown");
    } catch {
      // Authentication failures must still return a stable 401/403 if audit storage is unavailable.
    }
  }
}

function userFromClaims(payload: JWTPayload): AuthenticatedUser {
  return {
    subject: payload.sub!,
    displayName: stringClaim(payload.name) ?? payload.sub!,
    roles: stringArray(payload.roles),
    permissions: stringArray(payload.permissions),
    mustChangePassword: payload.must_change_password === true,
    claims: payload as Record<string, unknown>,
    ...(stringClaim(payload.email) ? { email: stringClaim(payload.email)! } : {}),
    ...(stringClaim(payload.customer_id) ? { customerId: stringClaim(payload.customer_id)! } : {}),
    ...(stringClaim(payload.organisation_id)
      ? { organisationId: stringClaim(payload.organisation_id)! }
      : {}),
  };
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "string" ? [value] : [];
}

function stringClaim(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
