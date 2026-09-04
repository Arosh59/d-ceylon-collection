import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const storePath = path.join(process.cwd(), "data", "local-auth-users.json");

export interface LocalAuthUser {
  email: string;
  id: string;
  name: string;
  passwordHash: string;
  roles: string[];
}

export async function createLocalCustomer(
  name: string,
  email: string,
  password: string,
): Promise<LocalAuthUser> {
  const users = await readUsers();
  const normalizedEmail = normalizeEmail(email);
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const user: LocalAuthUser = {
    email: normalizedEmail,
    id: randomUUID(),
    name: name.trim(),
    passwordHash: await hashPassword(password),
    roles: ["customer"],
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

export async function authenticateLocalCustomer(
  email: string,
  password: string,
): Promise<LocalAuthUser | null> {
  const normalizedEmail = normalizeEmail(email);
  const user = (await readUsers()).find((candidate) => candidate.email === normalizedEmail);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  return user;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [, saltHex, hashHex] = encoded.split("$");
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function readUsers(): Promise<LocalAuthUser[]> {
  try {
    const content = await readFile(storePath, "utf8");
    const parsed: unknown = JSON.parse(content);
    return Array.isArray(parsed) ? parsed.filter(isLocalAuthUser) : [];
  } catch (error) {
    if (isFileMissing(error)) return [];
    throw error;
  }
}

async function writeUsers(users: LocalAuthUser[]): Promise<void> {
  const directory = path.dirname(storePath);
  const temporaryPath = `${storePath}.${process.pid}.tmp`;
  await mkdir(directory, { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(users, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, storePath);
}

function isLocalAuthUser(value: unknown): value is LocalAuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<LocalAuthUser>;
  return (
    typeof user.email === "string" &&
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.passwordHash === "string" &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === "string")
  );
}

function isFileMissing(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}
