import { ForbiddenException } from "@nestjs/common";

jest.mock("jose", () => ({ SignJWT: jest.fn() }));

import { validateEnvironment } from "../src/configuration";
import type { AuthenticatedUser } from "../src/common/auth.types";
import { AccessController } from "../src/modules/access/access.controller";
import type { TestingTokenService } from "../src/modules/access/testing-token.service";
import type { SecurityAuditService } from "../src/database/security-audit.service";

describe("authorization and authentication configuration", () => {
  const customerId = "10000000-0000-0000-0000-000000000001";
  const organisationId = "20000000-0000-0000-0000-000000000001";
  const controller = new AccessController({} as TestingTokenService, {} as SecurityAuditService);

  it("allows only the customer and organisation identified by validated claims", () => {
    expect(controller.customer(customerId, user("customer", customerId))).toEqual({
      portal: "customer",
      access: "authorised",
    });
    expect(() =>
      controller.customer("10000000-0000-0000-0000-000000000002", user("customer", customerId)),
    ).toThrow(ForbiddenException);
    expect(controller.agent(organisationId, user("agent", undefined, organisationId))).toEqual({
      portal: "agent",
      access: "authorised",
    });
    expect(() =>
      controller.agent(
        "20000000-0000-0000-0000-000000000002",
        user("agent", undefined, organisationId),
      ),
    ).toThrow(ForbiddenException);
  });

  it("rejects insecure production identity configuration", () => {
    expect(() =>
      validateEnvironment({
        APP_ENVIRONMENT: "Production",
        DATABASE_URL: "postgresql://database.example.test/app",
        AUTH_AUTHORITY: "http://identity.example.test",
        AUTH_ISSUER: "http://identity.example.test",
        AUTH_AUDIENCE: "dceylon-api",
      }),
    ).toThrow("must use HTTPS");
  });

  it("cannot enable testing authentication without independent strong keys", () => {
    expect(() =>
      validateEnvironment({
        APP_ENVIRONMENT: "Testing",
        AUTH_TEST_ISSUER: "https://identity.test.invalid",
        AUTH_TEST_AUDIENCE: "dceylon-api",
        AUTH_TEST_SIGNING_KEY: "short",
        AUTH_TEST_ENDPOINT_KEY: "short",
      }),
    ).toThrow("AUTH_TEST_SIGNING_KEY");
  });
});

function user(role: string, customerId?: string, organisationId?: string): AuthenticatedUser {
  return {
    subject: `test-${role}`,
    displayName: `Test ${role}`,
    roles: [role],
    permissions: [],
    claims: {},
    ...(customerId ? { customerId } : {}),
    ...(organisationId ? { organisationId } : {}),
  };
}
