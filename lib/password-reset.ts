import "server-only";
import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { hashToken } from "@/lib/session";

// How long the user has to choose a new password after answering their
// security question correctly.
export const RESET_TTL_MS = 10 * 60 * 1000;
export const RESET_COOKIE = "password_reset";

// Creates a single-use reset token, replacing any earlier one for this user.
// Only the token's hash is stored; the raw token goes in the reset cookie.
export async function createResetToken(userId: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await sql.begin(async (tx) => {
    await tx`DELETE FROM password_resets WHERE user_id = ${userId}`;
    await tx`
      INSERT INTO password_resets (id, user_id, expires_at)
      VALUES (${hashToken(token)}, ${userId}, ${new Date(Date.now() + RESET_TTL_MS)})
    `;
  });
  return token;
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  const [row] = await sql<{ expires_at: Date }[]>`
    SELECT expires_at FROM password_resets WHERE id = ${hashToken(token)}
  `;
  return !!row && row.expires_at.getTime() >= Date.now();
}

// Sets the new password, burns the token and signs the user out everywhere,
// so anyone who had their old password loses access. Returns the user's email,
// or null if the token is invalid or expired.
export async function resetPassword(token: string, passwordHash: string): Promise<string | null> {
  return sql.begin(async (tx) => {
    // Deleting the token claims it, so two concurrent requests can't both use it.
    const [reset] = await tx<{ user_id: number; expires_at: Date }[]>`
      DELETE FROM password_resets WHERE id = ${hashToken(token)} RETURNING user_id, expires_at
    `;
    if (!reset || reset.expires_at.getTime() < Date.now()) return null;

    const [{ email }] = await tx<{ email: string }[]>`
      UPDATE users SET password_hash = ${passwordHash} WHERE id = ${reset.user_id} RETURNING email
    `;
    await tx`DELETE FROM password_resets WHERE user_id = ${reset.user_id}`;
    await tx`DELETE FROM sessions WHERE user_id = ${reset.user_id}`;
    return email;
  });
}
