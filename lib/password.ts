import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

// Stored format: scrypt$<salt hex>$<hash hex>
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = stored.split("$");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Used when no user matches an email, so a failed lookup takes as long as a
// wrong password and response times don't reveal which emails are registered.
export const DUMMY_HASH =
  "scrypt$00000000000000000000000000000000$" + "0".repeat(KEY_LENGTH * 2);

// Shared by sign-up and password reset.
export function passwordRuleErrors(password: string): string[] {
  const errors = [];
  if (password.length < 8) errors.push("Be at least 8 characters long.");
  if (!/[a-zA-Z]/.test(password)) errors.push("Contain at least one letter.");
  if (!/[0-9]/.test(password)) errors.push("Contain at least one number.");
  return errors;
}
