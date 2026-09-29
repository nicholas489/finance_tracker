import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// The cookie holds a random token; the database only stores its hash, so a
// leaked database can't be used to hijack sessions.
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_MS;

  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, ${new Date(expiresAt)})
  `;

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

export async function getSessionUser(token: string): Promise<SessionUser | null> {
  const [row] = await sql<(SessionUser & { expires_at: Date })[]>`
    SELECT u.id, u.name, u.email, s.expires_at
      FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ${hashToken(token)}
  `;

  if (!row) return null;
  if (row.expires_at.getTime() < Date.now()) {
    await sql`DELETE FROM sessions WHERE id = ${hashToken(token)}`;
    return null;
  }
  return { id: row.id, name: row.name, email: row.email };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await sql`DELETE FROM sessions WHERE id = ${hashToken(token)}`;
  cookieStore.delete(SESSION_COOKIE);
}
