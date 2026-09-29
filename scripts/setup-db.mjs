// Creates the tables in db/schema.sql. Run with `npm run db:setup`.
import { readFileSync } from "node:fs";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
await sql.unsafe(readFileSync("db/schema.sql", "utf8")).simple();
await sql.end();
console.log("Database schema is up to date.");
