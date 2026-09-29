import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// The cookie holds a random token; the database only stores its hash, so a
// leaked database can't be used to hijack sessions.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_MS;

  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    hashToken(token),
    userId,
    expiresAt,
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export type SessionUser = { id: number; name: string; email: string };

export function getSessionUser(token: string): SessionUser | null {
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, s.expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ?`,
    )
    .get(hashToken(token)) as (SessionUser & { expires_at: number }) | undefined;

  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
    return null;
  }
  return { id: row.id, name: row.name, email: row.email };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
  cookieStore.delete(SESSION_COOKIE);
}
