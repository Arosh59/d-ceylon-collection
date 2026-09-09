import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { PasswordService } from "../modules/auth/password.service";

if (existsSync(".env")) loadEnvFile(".env");

async function run(): Promise<void> {
  const email = required("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = required("BOOTSTRAP_ADMIN_PASSWORD");
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Administrator";
  const minimumLength = process.env.APP_ENVIRONMENT === "Development" ? 8 : 12;
  if (password.length < minimumLength)
    throw new Error(
      `BOOTSTRAP_ADMIN_PASSWORD must be at least ${minimumLength} characters in ${process.env.APP_ENVIRONMENT ?? "this environment"}.`,
    );

  const database = new PrismaClient();
  try {
    const matches = await database.applicationUser.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      take: 2,
    });
    if (matches.length > 1)
      throw new Error(
        "Multiple users have this email; resolve the duplicate before bootstrapping.",
      );
    const now = new Date();
    const userId = matches[0]?.id ?? randomUUID();
    const passwordIdentity = await database.userIdentity.findUnique({
      where: { provider_subject: { provider: "password", subject: email } },
    });
    if (passwordIdentity && passwordIdentity.userId !== userId) {
      throw new Error("The password identity is already linked to a different user.");
    }
    const passwordHash = await new PasswordService().hash(password);
    await database.$transaction(async (transaction) => {
      if (!matches[0]) {
        await transaction.applicationUser.create({
          data: {
            id: userId,
            issuer: "dceylon",
            subject: userId,
            email,
            displayName: name,
            isActive: true,
            createdAtUtc: now,
            updatedAtUtc: now,
            concurrencyToken: randomUUID(),
          },
        });
      } else if (!matches[0].isActive) {
        throw new Error(
          "The matching user is inactive; reactivate it through the controlled user-management process first.",
        );
      }
      await transaction.passwordCredential.upsert({
        where: { userId },
        create: {
          userId,
          passwordHash,
          passwordChangedAtUtc: now,
          mustChangePassword: true,
          createdAtUtc: now,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
        update: {
          passwordHash,
          passwordChangedAtUtc: now,
          mustChangePassword: true,
          failedLoginCount: 0,
          lockedUntilUtc: null,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
      });
      await transaction.userIdentity.upsert({
        where: { provider_subject: { provider: "password", subject: email } },
        create: {
          id: randomUUID(),
          userId,
          provider: "password",
          subject: email,
          email,
          createdAtUtc: now,
          updatedAtUtc: now,
        },
        update: { userId, email, updatedAtUtc: now },
      });
      const role = await transaction.role.upsert({
        where: { code: "administrator" },
        create: {
          id: randomUUID(),
          code: "administrator",
          name: "Administrator",
          createdAtUtc: now,
          updatedAtUtc: now,
          concurrencyToken: randomUUID(),
        },
        update: {},
      });
      await transaction.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        create: { userId, roleId: role.id },
        update: {},
      });
    });
    process.stdout.write(`Administrator role assigned to ${email}.\n`);
  } finally {
    await database.$disconnect();
  }
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

void run().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Administrator bootstrap failed."}\n`,
  );
  process.exitCode = 1;
});
