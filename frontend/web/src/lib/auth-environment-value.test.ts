import { describe, expect, it } from "vitest";

import { readAuthenticationEnvironment } from "./auth-environment-value";

const valid = {
  APP_ENVIRONMENT: "Production",
  AUTH_AUDIENCE: "dceylon-api",
  AUTH_CLIENT_ID: "dceylon-web",
  AUTH_CLIENT_SECRET: "provider-client-secret",
  AUTH_ISSUER: "https://dceylon-test.us.auth0.com",
  AUTH_SCOPE: "openid profile email dceylon.api",
  AUTH_SECRET: "session-secret-with-at-least-32-characters",
} as const;

describe("readAuthenticationEnvironment", () => {
  it("accepts a production OIDC configuration", () => {
    expect(readAuthenticationEnvironment(valid)).toMatchObject({
      applicationEnvironment: "Production",
      audience: "dceylon-api",
      clientId: "dceylon-web",
      issuer: "https://dceylon-test.us.auth0.com",
    });
  });

  it("defaults a missing environment to Development and accepts common casing", () => {
    expect(
      readAuthenticationEnvironment({
        AUTH_CLIENT_ID: valid.AUTH_CLIENT_ID,
        AUTH_CLIENT_SECRET: valid.AUTH_CLIENT_SECRET,
        AUTH_ISSUER: valid.AUTH_ISSUER,
        AUTH_SCOPE: valid.AUTH_SCOPE,
        AUTH_SECRET: valid.AUTH_SECRET,
      }),
    ).toMatchObject({
      applicationEnvironment: "Development",
    });
    expect(
      readAuthenticationEnvironment({ ...valid, APP_ENVIRONMENT: "production" }),
    ).toMatchObject({ applicationEnvironment: "Production" });
  });

  it("rejects an unknown environment", () => {
    expect(() => readAuthenticationEnvironment({ ...valid, APP_ENVIRONMENT: "local" })).toThrow(
      "APP_ENVIRONMENT must be Development, Production, or Testing.",
    );
  });

  it("rejects test authentication outside Testing", () => {
    expect(() =>
      readAuthenticationEnvironment({
        ...valid,
        AUTH_TEST_ENDPOINT_KEY: "test-key-with-at-least-32-characters",
      }),
    ).toThrow("can only be used");
  });

  it("rejects insecure production issuers and missing openid scope", () => {
    expect(() =>
      readAuthenticationEnvironment({
        ...valid,
        AUTH_ISSUER: "http://identity.example.test",
      }),
    ).toThrow("HTTPS origin");
    expect(() =>
      readAuthenticationEnvironment({
        ...valid,
        AUTH_SCOPE: "profile email",
      }),
    ).toThrow("must include openid");
  });

  it("rejects deployment placeholders before starting an OIDC request", () => {
    expect(() =>
      readAuthenticationEnvironment({
        ...valid,
        AUTH_ISSUER: "https://your-identity-provider.com",
      }),
    ).toThrow("AUTH_ISSUER is still a placeholder");
    expect(() =>
      readAuthenticationEnvironment({
        ...valid,
        AUTH_CLIENT_SECRET: "replace-with-real-oidc-client-secret",
      }),
    ).toThrow("AUTH_CLIENT_SECRET is still a placeholder");
  });
});
