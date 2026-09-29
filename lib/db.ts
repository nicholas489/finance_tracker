import "server-only";
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");

// Supabase's transaction pooler doesn't support prepared statements.
function open() {
  return postgres(process.env.DATABASE_URL!, { prepare: false });
}

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };
export const sql = globalForDb.sql ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
