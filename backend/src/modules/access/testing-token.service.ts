import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";

import { DomainError } from "../../common/problem-details.filter";

const identities = {
  customer: {
    subject: "test-customer",
    displayName: "Test Customer",
    email: "customer@example.test",
    roles: ["customer"],
    customerId: "10000000-0000-0000-0000-000000000001",
    organisationId: null,
  },
  "customer-other": {
    subject: "test-customer-other",
    displayName: "Other Test Customer",
    email: "other-customer@example.test",
    roles: ["customer"],
    customerId: "10000000-0000-0000-0000-000000000002",
    organisationId: null,
  },
  agent: {
    subject: "test-agent",
    displayName: "Test Agent",
    email: "agent@example.test",
    roles: ["agent"],
    customerId: null,
    organisationId: "20000000-0000-0000-0000-000000000001",
  },
  "agent-other": {
    subject: "test-agent-other",
    displayName: "Other Test Agent",
    email: "other-agent@example.test",
    roles: ["agent"],
    customerId: null,
    organisationId: "20000000-0000-0000-0000-000000000002",
  },
  staff: {
    subject: "test-staff",
    displayName: "Test Staff",
    email: "staff@example.test",
    roles: ["staff"],
    customerId: null,
    organisationId: null,
  },
  administrator: {
    subject: "test-administrator",
    displayName: "Test Administrator",
    email: "administrator@example.test",
    roles: ["administrator"],
    customerId: null,
    organisationId: null,
  },
} as const;

@Injectable()
export class TestingTokenService {
  public constructor(private readonly config: ConfigService) {}

  public async issue(persona: string): Promise<Record<string, unknown>> {
    const identity = identities[persona.trim().toLowerCase() as keyof typeof identities];
    if (!identity) {
      throw new DomainError(
        400,
        "Use customer, customer-other, agent, agent-other, staff, or administrator.",
        "Validation failed",
        { persona: ["The testing persona is not supported."] },
      );
    }
    const issuer = this.config.getOrThrow<string>("AUTH_TEST_ISSUER");
    const audience = this.config.getOrThrow<string>("AUTH_TEST_AUDIENCE");
    const secret = new TextEncoder().encode(
      this.config.getOrThrow<string>("AUTH_TEST_SIGNING_KEY"),
    );
    const now = Math.floor(Date.now() / 1000);
    const expires = now + 600;
    const token = await new SignJWT({
      name: identity.displayName,
      email: identity.email,
      roles: identity.roles,
      ...(identity.customerId ? { customer_id: identity.customerId } : {}),
      ...(identity.organisationId ? { organisation_id: identity.organisationId } : {}),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject(identity.subject)
      .setJti(randomUUID().replaceAll("-", ""))
      .setIssuedAt(now)
      .setExpirationTime(expires)
      .sign(secret);
    return {
      accessToken: token,
      expiresAtUtc: new Date(expires * 1000).toISOString(),
      identity,
    };
  }
}
