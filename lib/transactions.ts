import "server-only";
import { sql } from "@/lib/db";
import type { TransactionInput, TransactionType } from "@/lib/transaction-form";

export type Transaction = TransactionInput & { id: number };

export type TransactionFilters = {
  type?: TransactionType;
  category?: string;
  from?: string; // inclusive, "YYYY-MM-DD"
  to?: string; // inclusive, "YYYY-MM-DD"
};

// amount comes back as text and date as "YYYY-MM-DD" so neither is shifted by
// float rounding or the server's time zone.
const columns = sql`
  id, type, name, amount::text AS amount, to_char(date, 'YYYY-MM-DD') AS date, category, description
`;

// Every query is scoped to the user, so nobody can read or change another
// user's transactions by guessing an id.
export async function listTransactions(userId: number, filters: TransactionFilters) {
  return sql<Transaction[]>`
    SELECT ${columns} FROM transactions
     WHERE user_id = ${userId}
       ${filters.type ? sql`AND type = ${filters.type}` : sql``}
       ${filters.category ? sql`AND category = ${filters.category}` : sql``}
       ${filters.from ? sql`AND date >= ${filters.from}` : sql``}
       ${filters.to ? sql`AND date <= ${filters.to}` : sql``}
     ORDER BY date DESC, id DESC
  `;
}

export async function getTransaction(userId: number, id: number): Promise<Transaction | null> {
  const [row] = await sql<Transaction[]>`
    SELECT ${columns} FROM transactions WHERE id = ${id} AND user_id = ${userId}
  `;
  return row ?? null;
}

export async function createTransaction(userId: number, t: TransactionInput) {
  await sql`
    INSERT INTO transactions (user_id, type, name, amount, date, category, description)
    VALUES (${userId}, ${t.type}, ${t.name}, ${t.amount}, ${t.date}, ${t.category}, ${t.description})
  `;
}

// Returns false if the transaction doesn't exist or belongs to someone else.
export async function updateTransaction(userId: number, id: number, t: TransactionInput) {
  const result = await sql`
    UPDATE transactions
       SET type = ${t.type}, name = ${t.name}, amount = ${t.amount}, date = ${t.date},
           category = ${t.category}, description = ${t.description}
     WHERE id = ${id} AND user_id = ${userId}
  `;
  return result.count > 0;
}

export async function deleteTransaction(userId: number, id: number) {
  await sql`DELETE FROM transactions WHERE id = ${id} AND user_id = ${userId}`;
}
