import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";

import type { AuthenticationIdentity } from "./auth.types";

@Injectable()
export class ApplicationJwtService {
  public constructor(private readonly config: ConfigService) {}

  public async issue(
    identity: AuthenticationIdentity,
    sessionId: string,
  ): Promise<{
    token: string;
    expiresAtUtc: string;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const expires = now + accessTtlSeconds(this.config.get<string>("JWT_ACCESS_TTL") ?? "15m");
    const token = await new SignJWT({
      name: identity.displayName,
      email: identity.email,
      roles: identity.roles,
      permissions: identity.permissions,
      must_change_password: identity.mustChangePassword,
      sid: sessionId,
      ...(identity.customerId ? { customer_id: identity.customerId } : {}),
      ...(identity.organisationId ? { organisation_id: identity.organisationId } : {}),
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(this.config.get<string>("JWT_ISSUER") ?? "dceylon-api")
      .setAudience(this.config.get<string>("JWT_AUDIENCE") ?? "dceylon-api")
      .setSubject(identity.subject)
      .setJti(randomUUID())
      .setIssuedAt(now)
      .setExpirationTime(expires)
      .sign(this.secret());
    return { token, expiresAtUtc: new Date(expires * 1000).toISOString() };
  }

  public async verify(token: string): Promise<JWTPayload> {
    return (
      await jwtVerify(token, this.secret(), {
        issuer: this.config.get<string>("JWT_ISSUER") ?? "dceylon-api",
        audience: this.config.get<string>("JWT_AUDIENCE") ?? "dceylon-api",
        algorithms: ["HS256"],
      })
    ).payload;
  }

  private secret(): Uint8Array {
    return new TextEncoder().encode(this.config.getOrThrow<string>("JWT_ACCESS_SECRET"));
  }
}

function accessTtlSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/u.exec(value.trim());
  if (!match) throw new Error("JWT_ACCESS_TTL must use a value such as 15m, 1h, or 1d.");
  const amount = Number(match[1]);
  const factors = { s: 1, m: 60, h: 3600, d: 86400 } as const;
  return amount * factors[match[2] as keyof typeof factors];
}
