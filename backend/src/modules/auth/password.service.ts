import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

@Injectable()
export class PasswordService {
  public async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
  }

  public async verify(password: string, encoded: string): Promise<boolean> {
    const [algorithm, saltHex, hashHex] = encoded.split("$");
    if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, "hex");
    const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
