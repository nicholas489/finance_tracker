import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/session";

const RESET_TTL_MS = 30 * 60 * 1000;

// Creates a single-use reset token, replacing any earlier one for this user.
// Only the token's hash is stored; the raw token goes in the emailed link.
export function createResetToken(userId: number): string {
  const token = randomBytes(32).toString("base64url");
  db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(userId);
  db.prepare("INSERT INTO password_resets (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    hashToken(token),
    userId,
    Date.now() + RESET_TTL_MS,
  );
  return token;
}

export function isResetTokenValid(token: string): boolean {
  return findUserId(token) !== null;
}

function findUserId(token: string): number | null {
  const row = db
    .prepare("SELECT user_id, expires_at FROM password_resets WHERE id = ?")
    .get(hashToken(token)) as { user_id: number; expires_at: number } | undefined;
  if (!row || row.expires_at < Date.now()) return null;
  return row.user_id;
}

// Sets the new password, burns the token and signs the user out everywhere,
// so anyone who had their old password loses access. Returns the user's email,
// or null if the token is invalid or expired.
export function resetPassword(token: string, passwordHash: string): string | null {
  db.exec("BEGIN IMMEDIATE");
  try {
    const userId = findUserId(token);
    if (userId === null) {
      db.exec("ROLLBACK");
      return null;
    }
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, userId);
    db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    const { email } = db.prepare("SELECT email FROM users WHERE id = ?").get(userId) as {
      email: string;
    };
    db.exec("COMMIT");
    return email;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
