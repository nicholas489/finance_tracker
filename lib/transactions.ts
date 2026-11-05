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

export type MonthTotals = { income: string; expenses: string };

// One month's totals. month is "YYYY-MM". Summed in the database and returned
// as text so cents are never rounded through a float.
export async function getMonthTotals(userId: number, month: string) {
  const start = `${month}-01`;
  const [totals] = await sql<MonthTotals[]>`
    SELECT COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::text AS income,
           COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::text AS expenses
      FROM transactions
     WHERE user_id = ${userId}
       AND date >= ${start}::date AND date < ${start}::date + interval '1 month'
  `;
  return totals;
}

export type MonthSpending = { month: string; expenses: string };

// Expenses for each of the months from `from` to `to` ("YYYY-MM", inclusive),
// oldest first. Months with no expenses are included with a total of 0.
export async function getMonthlySpending(userId: number, from: string, to: string) {
  return sql<MonthSpending[]>`
    SELECT to_char(m.start, 'YYYY-MM') AS month, COALESCE(SUM(t.amount), 0)::text AS expenses
      FROM generate_series(${`${from}-01`}::date, ${`${to}-01`}::date, interval '1 month') AS m(start)
      LEFT JOIN transactions t
        ON t.user_id = ${userId} AND t.type = 'expense'
       AND t.date >= m.start AND t.date < m.start + interval '1 month'
     GROUP BY m.start
     ORDER BY m.start
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
