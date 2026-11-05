// Makes an existing account an admin. Run with `npm run admin:grant -- <email>`.
import postgres from "postgres";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run admin:grant -- <email>");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const [user] = await sql`
  UPDATE users SET is_admin = true, deactivated_at = NULL WHERE email = ${email} RETURNING id
`;
await sql.end();

if (!user) {
  console.error(`No account has the email ${email}. Sign up first, then run this again.`);
  process.exit(1);
}
console.log(`${email} is now an admin.`);
