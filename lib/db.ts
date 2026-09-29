import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "finance-tracker.db");

function open() {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT    NOT NULL,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT    PRIMARY KEY, -- sha256 of the token stored in the cookie
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL      -- unix ms
    );
    CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);
  `);
  return db;
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: DatabaseSync };
export const db = globalForDb.db ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
