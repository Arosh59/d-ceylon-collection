import { ConfigService } from "@nestjs/config";

const verifyIdToken = jest.fn();
jest.mock("firebase-admin/app", () => ({
  cert: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(() => ({ name: "test" })),
}));
jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => ({ verifyIdToken })),
}));

import { FirebaseAuthService } from "../src/modules/auth/firebase-auth.service";
import { PasswordService } from "../src/modules/auth/password.service";
import { digest, RefreshTokenService } from "../src/modules/auth/refresh-token.service";

describe("NestJS authentication primitives", () => {
  it("hashes passwords with a unique salt and verifies only the original password", async () => {
    const passwords = new PasswordService();
    const first = await passwords.hash("correct horse battery staple");
    const second = await passwords.hash("correct horse battery staple");

    expect(first).toMatch(/^scrypt\$/u);
    expect(second).not.toBe(first);
    await expect(passwords.verify("correct horse battery staple", first)).resolves.toBe(true);
    await expect(passwords.verify("incorrect", first)).resolves.toBe(false);
  });

  it("accepts only verified Firebase Google identities", async () => {
    const firebase = new FirebaseAuthService(firebaseConfig());
    verifyIdToken.mockResolvedValueOnce({
      uid: "firebase-user",
      email: "USER@EXAMPLE.COM",
      email_verified: true,
      name: "Firebase User",
      firebase: { sign_in_provider: "google.com" },
    });
    await expect(firebase.verifyGoogleIdToken("token")).resolves.toEqual({
      uid: "firebase-user",
      email: "user@example.com",
      displayName: "Firebase User",
    });

    verifyIdToken.mockResolvedValueOnce({
      uid: "password-user",
      email: "user@example.com",
      email_verified: true,
      firebase: { sign_in_provider: "password" },
    });
    await expect(firebase.verifyGoogleIdToken("token")).rejects.toThrow(
      "A verified Google identity is required.",
    );
  });

  it("rotates refresh tokens exactly once", async () => {
    const current = "10000000-0000-0000-0000-000000000001.secret";
    const database = {
      refreshSession: {
        findUnique: jest.fn().mockResolvedValue({
          id: "10000000-0000-0000-0000-000000000001",
          userId: "20000000-0000-0000-0000-000000000001",
          familyId: "30000000-0000-0000-0000-000000000001",
          tokenHash: digest(current),
          expiresAtUtc: new Date(Date.now() + 60_000),
          revokedAtUtc: null,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new RefreshTokenService(
      database as never,
      new ConfigService({ JWT_REFRESH_TTL: "30d" }),
    );

    const rotated = await service.rotate(current, { correlationId: "test" });
    expect(rotated.userId).toBe("20000000-0000-0000-0000-000000000001");
    expect(rotated.token).not.toBe(current);
    expect(database.refreshSession.updateMany).toHaveBeenCalledTimes(1);
  });
});

function firebaseConfig(): ConfigService {
  return new ConfigService({
    FIREBASE_PROJECT_ID: "dceylon-test",
    FIREBASE_CLIENT_EMAIL: "firebase@example.test",
    FIREBASE_PRIVATE_KEY: "private-key",
  });
}
