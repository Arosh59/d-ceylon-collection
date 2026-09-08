import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { DatabaseService } from "../../database/database.service";
import { durationMilliseconds } from "./auth-duration";
import type { AuthenticationContext } from "./auth.types";

@Injectable()
export class RefreshTokenService {
  public constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  public async issue(
    userId: string,
    context: AuthenticationContext,
    familyId: string = randomUUID(),
  ): Promise<{ token: string; expiresAtUtc: string }> {
    const id = randomUUID();
    const token = `${id}.${randomBytes(32).toString("base64url")}`;
    const expires = new Date(
      Date.now() + durationMilliseconds(this.config.get<string>("JWT_REFRESH_TTL") ?? "30d"),
    );
    await this.database.refreshSession.create({
      data: {
        id,
        userId,
        familyId,
        tokenHash: digest(token),
        expiresAtUtc: expires,
        createdAtUtc: new Date(),
        userAgent: context.userAgent?.slice(0, 500),
        ipAddress: context.ipAddress?.slice(0, 64),
      },
    });
    return { token, expiresAtUtc: expires.toISOString() };
  }

  public async rotate(
    token: string,
    context: AuthenticationContext,
  ): Promise<{ userId: string; token: string; expiresAtUtc: string }> {
    const id = token.split(".")[0];
    if (!id) throw new UnauthorizedException("The refresh token is invalid.");
    const session = await this.database.refreshSession.findUnique({ where: { id } });
    if (!session || !safeEquals(session.tokenHash, digest(token))) {
      throw new UnauthorizedException("The refresh token is invalid.");
    }
    if (session.revokedAtUtc) {
      await this.database.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAtUtc: null },
        data: { revokedAtUtc: new Date() },
      });
      throw new UnauthorizedException("Refresh token reuse was detected.");
    }
    if (session.expiresAtUtc <= new Date()) {
      throw new UnauthorizedException("The refresh token has expired.");
    }
    const revoked = await this.database.refreshSession.updateMany({
      where: { id: session.id, revokedAtUtc: null },
      data: { revokedAtUtc: new Date() },
    });
    if (revoked.count !== 1) {
      await this.database.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAtUtc: null },
        data: { revokedAtUtc: new Date() },
      });
      throw new UnauthorizedException("Refresh token reuse was detected.");
    }
    const replacement = await this.issue(session.userId, context, session.familyId);
    await this.database.refreshSession.update({
      where: { id: session.id },
      data: {
        replacedBySessionId: replacement.token.split(".")[0],
      },
    });
    return { userId: session.userId, ...replacement };
  }

  public async revoke(token: string): Promise<string | null> {
    const id = token.split(".")[0];
    if (!id) return null;
    const session = await this.database.refreshSession.findUnique({ where: { id } });
    if (!session || !safeEquals(session.tokenHash, digest(token))) return null;
    await this.database.refreshSession.updateMany({
      where: { id, revokedAtUtc: null },
      data: { revokedAtUtc: new Date() },
    });
    return session.userId;
  }
}

export function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeEquals(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
