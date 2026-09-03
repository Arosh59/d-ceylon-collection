import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";

import { IS_PUBLIC, REQUIRED_ROLES } from "./auth.decorators";
import type { AuthenticatedRequest, AuthenticatedUser } from "./auth.types";

@Injectable()
export class AuthGuard implements CanActivate {
  private remoteKey: JWTVerifyGetKey | undefined;
  private remoteKeyPromise: Promise<JWTVerifyGetKey> | undefined;

  public constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
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
      throw new UnauthorizedException("Authentication is required.");
    }

    let payload: JWTPayload;
    try {
      payload = await this.verify(authorization.slice(7));
    } catch {
      throw new UnauthorizedException("The bearer token is invalid or expired.");
    }

    for (const required of ["sub", "jti", "iat"] as const) {
      if (payload[required] === undefined) {
        throw new UnauthorizedException(`The bearer token is missing ${required}.`);
      }
    }

    const roleClaim = this.config.get<string>("AUTH_ROLE_CLAIM") ?? "roles";
    const permissionClaim = this.config.get<string>("AUTH_PERMISSION_CLAIM") ?? "permissions";
    const customerClaim = this.config.get<string>("AUTH_CUSTOMER_CLAIM") ?? "customer_id";
    const organisationClaim =
      this.config.get<string>("AUTH_ORGANISATION_CLAIM") ?? "organisation_id";
    const user: AuthenticatedUser = {
      subject: payload.sub!,
      displayName: stringClaim(payload.name) ?? payload.sub!,
      roles: stringArray(payload[roleClaim]),
      permissions: stringArray(payload[permissionClaim]),
      claims: payload as Record<string, unknown>,
      ...(stringClaim(payload.email) ? { email: stringClaim(payload.email)! } : {}),
      ...(stringClaim(payload[customerClaim])
        ? { customerId: stringClaim(payload[customerClaim])! }
        : {}),
      ...(stringClaim(payload[organisationClaim])
        ? { organisationId: stringClaim(payload[organisationClaim])! }
        : {}),
    };
    request.user = user;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles?.length && !requiredRoles.some((role) => user.roles.includes(role))) {
      throw new ForbiddenException("The authenticated identity does not have the required role.");
    }
    return true;
  }

  private async verify(token: string): Promise<JWTPayload> {
    const testing = this.config.get<string>("APP_ENVIRONMENT") === "Testing";
    const issuer = testing
      ? this.config.getOrThrow<string>("AUTH_TEST_ISSUER")
      : this.config.getOrThrow<string>("AUTH_ISSUER");
    const audience = testing
      ? this.config.getOrThrow<string>("AUTH_TEST_AUDIENCE")
      : this.config.getOrThrow<string>("AUTH_AUDIENCE");
    if (testing) {
      const secret = new TextEncoder().encode(
        this.config.getOrThrow<string>("AUTH_TEST_SIGNING_KEY"),
      );
      return (await jwtVerify(token, secret, { issuer, audience })).payload;
    }
    this.remoteKey ??= await (this.remoteKeyPromise ??= this.discoverRemoteKey());
    return (await jwtVerify(token, this.remoteKey, { issuer, audience })).payload;
  }

  private async discoverRemoteKey(): Promise<JWTVerifyGetKey> {
    const authority = (
      this.config.get<string>("AUTH_AUTHORITY") ?? this.config.getOrThrow<string>("AUTH_ISSUER")
    ).replace(/\/$/u, "");
    const response = await fetch(`${authority}/.well-known/openid-configuration`);
    if (!response.ok) throw new Error(`OIDC discovery failed with HTTP ${response.status}.`);
    const metadata = (await response.json()) as { jwks_uri?: unknown };
    if (typeof metadata.jwks_uri !== "string")
      throw new Error("OIDC discovery did not provide jwks_uri.");
    return createRemoteJWKSet(new URL(metadata.jwks_uri));
  }
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "string" ? [value] : [];
}

function stringClaim(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
