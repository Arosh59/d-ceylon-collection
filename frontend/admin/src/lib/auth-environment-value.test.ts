import { describe, expect, it } from "vitest";

import { readAdminAuthenticationEnvironment } from "./auth-environment-value";

const local = {
  APP_ENVIRONMENT: "Development",
  AUTH_MODE: "local",
  AUTH_SECRET: "local-session-secret-with-at-least-32-characters",
  LOCAL_ADMIN_EMAIL: "admin@dceylon.local",
  LOCAL_ADMIN_PASSWORD: "local-admin-password",
} as const;

const oidc = {
  APP_ENVIRONMENT: "Production",
  AUTH_MODE: "oidc",
  AUTH_ISSUER: "https://identity.example.test",
  AUTH_CLIENT_ID: "dceylon-admin",
  AUTH_CLIENT_SECRET: "provider-client-secret",
  AUTH_SECRET: "production-session-secret-with-at-least-32-characters",
} as const;

describe("readAdminAuthenticationEnvironment", () => {
  it("accepts local administrator credentials in Development", () => {
    expect(readAdminAuthenticationEnvironment(local)).toMatchObject({
      applicationEnvironment: "Development",
      authenticationMode: "local",
      localAdminEmail: "admin@dceylon.local",
    });
  });

  it("defaults Development to local mode", () => {
    expect(readAdminAuthenticationEnvironment({ ...local, AUTH_MODE: undefined })).toMatchObject({
      authenticationMode: "local",
    });
  });

  it("rejects local authentication outside Development", () => {
    expect(() =>
      readAdminAuthenticationEnvironment({ ...local, APP_ENVIRONMENT: "Production" }),
    ).toThrow("only available in Development");
  });

  it("accepts a production OIDC configuration", () => {
    expect(readAdminAuthenticationEnvironment(oidc)).toMatchObject({
      applicationEnvironment: "Production",
      authenticationMode: "oidc",
      issuer: "https://identity.example.test",
    });
  });

  it("preserves an OIDC issuer path", () => {
    expect(
      readAdminAuthenticationEnvironment({
        ...oidc,
        AUTH_ISSUER: "https://identity.example.test/tenant/",
      }).issuer,
    ).toBe("https://identity.example.test/tenant");
  });

  it("requires OIDC values in Production", () => {
    expect(() => readAdminAuthenticationEnvironment({ ...oidc, AUTH_ISSUER: undefined })).toThrow(
      "AUTH_ISSUER is required",
    );
    expect(() =>
      readAdminAuthenticationEnvironment({ ...oidc, AUTH_CLIENT_ID: undefined }),
    ).toThrow("AUTH_CLIENT_ID is required");
  });

  it("requires a sufficiently long session secret", () => {
    expect(() =>
      readAdminAuthenticationEnvironment({ ...local, AUTH_SECRET: "too-short" }),
    ).toThrow("at least 32 characters");
  });

  it("rejects insecure non-loopback OIDC issuers", () => {
    expect(() =>
      readAdminAuthenticationEnvironment({
        ...oidc,
        APP_ENVIRONMENT: "Development",
        AUTH_ISSUER: "http://identity.example.test",
      }),
    ).toThrow("HTTPS URL");
  });
});
