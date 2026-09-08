import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { DatabaseService } from "../../database/database.service";
import { ApplicationJwtService } from "./application-jwt.service";
import { AuthAuditService } from "./auth-audit.service";
import type {
  AuthenticationContext,
  AuthenticationIdentity,
  AuthenticationTokens,
} from "./auth.types";
import { FirebaseAuthService } from "./firebase-auth.service";
import { PasswordService } from "./password.service";
import { RefreshTokenService } from "./refresh-token.service";

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MILLISECONDS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  public constructor(
    private readonly database: DatabaseService,
    private readonly passwords: PasswordService,
    private readonly firebase: FirebaseAuthService,
    private readonly jwt: ApplicationJwtService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly audit: AuthAuditService,
  ) {}

  public async register(
    name: string,
    email: string,
    password: string,
    context: AuthenticationContext,
  ): Promise<AuthenticationTokens> {
    const normalized = normalizeEmail(email);
    const existing = await this.database.applicationUser.findFirst({
      where: { email: { equals: normalized, mode: "insensitive" } },
    });
    if (existing) {
      await this.audit.record("register", "denied", existing.id, context.correlationId);
      throw new ConflictException("An account with this email already exists.");
    }
    const passwordHash = await this.passwords.hash(password);
    const userId = randomUUID();
    const now = new Date();
    await this.database.$transaction(async (transaction) => {
      let customerRole = await transaction.role.findUnique({ where: { code: "customer" } });
      customerRole ??= await transaction.role.create({
        data: {
          id: randomUUID(),
          code: "customer",
          name: "Customer",
          createdAtUtc: now,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
      });
      await transaction.applicationUser.create({
        data: {
          id: userId,
          issuer: "dceylon",
          subject: userId,
          email: normalized,
          displayName: name.trim(),
          isActive: true,
          createdAtUtc: now,
          updatedAtUtc: now,
          lastAuthenticatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
      });
      await transaction.passwordCredential.create({
        data: {
          userId,
          passwordHash,
          passwordChangedAtUtc: now,
          createdAtUtc: now,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
      });
      await transaction.userIdentity.create({
        data: {
          id: randomUUID(),
          userId,
          provider: "password",
          subject: normalized,
          email: normalized,
          createdAtUtc: now,
          updatedAtUtc: now,
          lastAuthenticatedAtUtc: now,
        },
      });
      await transaction.customerAccount.create({
        data: {
          id: randomUUID(),
          userId,
          createdAtUtc: now,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
      });
      await transaction.userRole.create({ data: { userId, roleId: customerRole.id } });
    });
    await this.audit.record("register", "succeeded", userId, context.correlationId);
    return this.issue(userId, context);
  }

  public async login(
    email: string,
    password: string,
    context: AuthenticationContext,
  ): Promise<AuthenticationTokens> {
    const normalized = normalizeEmail(email);
    const users = await this.database.applicationUser.findMany({
      where: { email: { equals: normalized, mode: "insensitive" }, isActive: true },
      include: { passwordCredential: true },
      take: 2,
    });
    const user = users.length === 1 ? users[0] : undefined;
    const credential = user?.passwordCredential;
    if (!user || !credential || (credential.lockedUntilUtc?.getTime() ?? 0) > Date.now()) {
      await this.audit.record("login-password", "denied", user?.id ?? null, context.correlationId);
      throw invalidCredentials();
    }
    if (!(await this.passwords.verify(password, credential.passwordHash))) {
      const failures = credential.failedLoginCount + 1;
      await this.database.passwordCredential.update({
        where: { userId: user.id },
        data: {
          failedLoginCount: failures,
          lockedUntilUtc:
            failures >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCKOUT_MILLISECONDS) : null,
          updatedAtUtc: new Date(),
          concurrencyToken: randomUUID(),
        },
      });
      await this.audit.record("login-password", "denied", user.id, context.correlationId);
      throw invalidCredentials();
    }
    const now = new Date();
    await this.database.$transaction([
      this.database.passwordCredential.update({
        where: { userId: user.id },
        data: {
          failedLoginCount: 0,
          lockedUntilUtc: null,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
      }),
      this.database.applicationUser.update({
        where: { id: user.id },
        data: { lastAuthenticatedAtUtc: now, updatedAtUtc: now, concurrencyToken: randomUUID() },
      }),
    ]);
    await this.audit.record("login-password", "succeeded", user.id, context.correlationId);
    return this.issue(user.id, context);
  }

  public async google(
    idToken: string,
    context: AuthenticationContext,
  ): Promise<AuthenticationTokens> {
    let google;
    try {
      google = await this.firebase.verifyGoogleIdToken(idToken);
    } catch (error) {
      await this.audit.record("login-google", "denied", null, context.correlationId);
      throw error;
    }
    const existingIdentity = await this.database.userIdentity.findUnique({
      where: { provider_subject: { provider: "firebase-google", subject: google.uid } },
    });
    let userId = existingIdentity?.userId;
    if (!userId) {
      const matches = await this.database.applicationUser.findMany({
        where: { email: { equals: google.email, mode: "insensitive" }, isActive: true },
        take: 2,
      });
      if (matches.length > 1) {
        await this.audit.record("login-google", "denied", null, context.correlationId);
        throw new ConflictException("This verified email matches multiple existing accounts.");
      }
      userId =
        matches[0]?.id ?? (await this.createGoogleCustomer(google.displayName, google.email));
      const now = new Date();
      await this.database.userIdentity.create({
        data: {
          id: randomUUID(),
          userId,
          provider: "firebase-google",
          subject: google.uid,
          email: google.email,
          createdAtUtc: now,
          updatedAtUtc: now,
          lastAuthenticatedAtUtc: now,
        },
      });
    }
    await this.database.applicationUser.update({
      where: { id: userId },
      data: {
        displayName: google.displayName,
        lastAuthenticatedAtUtc: new Date(),
        updatedAtUtc: new Date(),
        concurrencyToken: randomUUID(),
      },
    });
    await this.audit.record("login-google", "succeeded", userId, context.correlationId);
    return this.issue(userId, context);
  }

  public async refresh(
    refreshToken: string,
    context: AuthenticationContext,
  ): Promise<AuthenticationTokens> {
    let rotated;
    try {
      rotated = await this.refreshTokens.rotate(refreshToken, context);
    } catch (error) {
      await this.audit.record("refresh", "denied", null, context.correlationId);
      throw error;
    }
    const identity = await this.identity(rotated.userId);
    const access = await this.jwt.issue(identity, tokenId(rotated.token));
    await this.audit.record("refresh", "succeeded", rotated.userId, context.correlationId);
    return {
      accessToken: access.token,
      accessTokenExpiresAtUtc: access.expiresAtUtc,
      refreshToken: rotated.token,
      refreshTokenExpiresAtUtc: rotated.expiresAtUtc,
      identity,
    };
  }

  public async logout(refreshToken: string, context: AuthenticationContext): Promise<void> {
    const userId = await this.refreshTokens.revoke(refreshToken);
    await this.audit.record("logout", "succeeded", userId, context.correlationId);
  }

  public async identity(userId: string): Promise<AuthenticationIdentity> {
    const user = await this.database.applicationUser.findUnique({
      where: { id: userId },
      include: {
        customerAccountRecords: true,
        userRoles: {
          include: {
            role: { include: { rolePermissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!user?.isActive) throw new UnauthorizedException("The account is inactive.");
    const organisations = await this.database.$queryRaw<{ organisation_id: string }[]>`
      SELECT organisation_id
      FROM organisations_agents.organisation_users
      WHERE user_id=${user.id}::uuid AND is_active=true
      ORDER BY created_at_utc
      LIMIT 1
    `;
    return {
      subject: user.id,
      displayName: user.displayName,
      email: user.email,
      roles: [...new Set(user.userRoles.map((assignment) => assignment.role.code))].sort(),
      permissions: [
        ...new Set(
          user.userRoles.flatMap((assignment) =>
            assignment.role.rolePermissions.map((grant) => grant.permission.code),
          ),
        ),
      ].sort(),
      customerId: user.customerAccountRecords?.id ?? null,
      organisationId: organisations[0]?.organisation_id ?? null,
    };
  }

  public async assertActiveSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.database.refreshSession.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAtUtc: null,
        expiresAtUtc: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!session) throw new UnauthorizedException("The application session has been revoked.");
  }

  private async issue(
    userId: string,
    context: AuthenticationContext,
  ): Promise<AuthenticationTokens> {
    const identity = await this.identity(userId);
    const refresh = await this.refreshTokens.issue(userId, context);
    const access = await this.jwt.issue(identity, tokenId(refresh.token));
    return {
      accessToken: access.token,
      accessTokenExpiresAtUtc: access.expiresAtUtc,
      refreshToken: refresh.token,
      refreshTokenExpiresAtUtc: refresh.expiresAtUtc,
      identity,
    };
  }

  private async createGoogleCustomer(name: string, email: string): Promise<string> {
    const id = randomUUID();
    const now = new Date();
    await this.database.$transaction(async (transaction) => {
      let role = await transaction.role.findUnique({ where: { code: "customer" } });
      role ??= await transaction.role.create({
        data: {
          id: randomUUID(),
          code: "customer",
          name: "Customer",
          createdAtUtc: now,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
      });
      await transaction.applicationUser.create({
        data: {
          id,
          issuer: "dceylon",
          subject: id,
          email,
          displayName: name,
          isActive: true,
          createdAtUtc: now,
          updatedAtUtc: now,
          lastAuthenticatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
      });
      await transaction.customerAccount.create({
        data: {
          id: randomUUID(),
          userId: id,
          createdAtUtc: now,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
      });
      await transaction.userRole.create({ data: { userId: id, roleId: role.id } });
    });
    return id;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException("The email address or password is incorrect.");
}

function tokenId(token: string): string {
  const id = token.split(".")[0];
  if (!id) throw new Error("The issued refresh token did not contain a session identifier.");
  return id;
}
