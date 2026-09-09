import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes, randomUUID } from "node:crypto";

import { DatabaseService } from "../../database/database.service";
import { AuthAuditService } from "./auth-audit.service";
import { durationMilliseconds } from "./auth-duration";
import type { AuthenticationContext } from "./auth.types";
import { digest } from "./refresh-token.service";
import { MailService } from "./mail.service";
import { PasswordService } from "./password.service";

@Injectable()
export class PasswordResetService {
  public constructor(
    private readonly database: DatabaseService,
    private readonly passwords: PasswordService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly audit: AuthAuditService,
  ) {}

  public async request(email: string, context: AuthenticationContext): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const users = await this.database.applicationUser.findMany({
      where: { email: { equals: normalized, mode: "insensitive" }, isActive: true },
      take: 2,
    });
    if (users.length !== 1 || !users[0]?.email) {
      await this.audit.record("password-reset-request", "succeeded", null, context.correlationId);
      return;
    }
    const rawToken = randomBytes(32).toString("base64url");
    await this.database.passwordResetToken.create({
      data: {
        id: randomUUID(),
        userId: users[0].id,
        tokenHash: digest(rawToken),
        expiresAtUtc: new Date(
          Date.now() + durationMilliseconds(this.config.get<string>("PASSWORD_RESET_TTL") ?? "1h"),
        ),
        requestIp: context.ipAddress?.slice(0, 64),
        createdAtUtc: new Date(),
      },
    });
    try {
      await this.mail.sendPasswordReset(users[0].email, rawToken);
      await this.audit.record(
        "password-reset-request",
        "succeeded",
        users[0].id,
        context.correlationId,
      );
    } catch {
      await this.database.passwordResetToken.update({
        where: { tokenHash: digest(rawToken) },
        data: { consumedAtUtc: new Date() },
      });
      await this.audit.record(
        "password-reset-request",
        "denied",
        users[0].id,
        context.correlationId,
      );
    }
  }

  public async reset(
    rawToken: string,
    password: string,
    context: AuthenticationContext,
  ): Promise<void> {
    const record = await this.database.passwordResetToken.findUnique({
      where: { tokenHash: digest(rawToken) },
    });
    if (!record || record.consumedAtUtc || record.expiresAtUtc <= new Date()) {
      await this.audit.record(
        "password-reset",
        "denied",
        record?.userId ?? null,
        context.correlationId,
      );
      throw new UnauthorizedException("The password reset token is invalid or expired.");
    }
    const now = new Date();
    const passwordHash = await this.passwords.hash(password);
    await this.database.$transaction(async (transaction) => {
      const consumed = await transaction.passwordResetToken.updateMany({
        where: { id: record.id, consumedAtUtc: null, expiresAtUtc: { gt: now } },
        data: { consumedAtUtc: now },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException("The password reset token is invalid or expired.");
      }
      await transaction.passwordCredential.upsert({
        where: { userId: record.userId },
        create: {
          userId: record.userId,
          passwordHash,
          passwordChangedAtUtc: now,
          mustChangePassword: false,
          createdAtUtc: now,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
        update: {
          passwordHash,
          passwordChangedAtUtc: now,
          mustChangePassword: false,
          failedLoginCount: 0,
          lockedUntilUtc: null,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
      });
      await transaction.passwordResetToken.updateMany({
        where: { userId: record.userId, consumedAtUtc: null },
        data: { consumedAtUtc: now },
      });
      await transaction.refreshSession.updateMany({
        where: { userId: record.userId, revokedAtUtc: null },
        data: { revokedAtUtc: now },
      });
    });
    await this.audit.record("password-reset", "succeeded", record.userId, context.correlationId);
  }
}
