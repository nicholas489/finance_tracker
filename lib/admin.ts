import "server-only";
import { sql } from "@/lib/db";

export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  isAdmin: boolean;
  deactivatedAt: Date | null;
  transactionCount: number;
};

// Every account, newest first.
export async function listUsers(): Promise<AdminUserRow[]> {
  const rows = await sql<
    {
      id: number;
      name: string;
      email: string;
      created_at: Date;
      is_admin: boolean;
      deactivated_at: Date | null;
      transaction_count: number;
    }[]
  >`
    SELECT u.id, u.name, u.email, u.created_at, u.is_admin, u.deactivated_at,
           (SELECT count(*)::int FROM transactions t WHERE t.user_id = u.id) AS transaction_count
      FROM users u
     ORDER BY u.created_at DESC
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    isAdmin: row.is_admin,
    deactivatedAt: row.deactivated_at,
    transactionCount: row.transaction_count,
  }));
}

// Admins can't be deactivated here, including the one doing it, so the system
// is never left without an admin. Returns false if the user doesn't exist or
// is an admin.
export async function setUserActive(userId: number, active: boolean): Promise<boolean> {
  return sql.begin(async (tx) => {
    const [user] = active
      ? await tx`
          UPDATE users SET deactivated_at = NULL
           WHERE id = ${userId} AND NOT is_admin
          RETURNING id
        `
      : await tx`
          UPDATE users SET deactivated_at = coalesce(deactivated_at, now())
           WHERE id = ${userId} AND NOT is_admin
          RETURNING id
        `;
    if (!user) return false;
    // Sign them out everywhere and cancel any password reset in progress.
    if (!active) {
      await tx`DELETE FROM sessions WHERE user_id = ${userId}`;
      await tx`DELETE FROM password_resets WHERE user_id = ${userId}`;
    }
    return true;
  });
}
