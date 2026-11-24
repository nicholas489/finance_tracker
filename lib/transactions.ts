import "server-only";
import { sql } from "@/lib/db";
import type { TransactionInput, TransactionType } from "@/lib/transaction-form";

// recurringId is set when it was added by a recurring transaction.
export type Transaction = TransactionInput & { id: number; recurringId: number | null };

export type TransactionFilters = {
  type?: TransactionType;
  category?: string;
  from?: string; // inclusive, "YYYY-MM-DD"
  to?: string; // inclusive, "YYYY-MM-DD"
  search?: string; // matches anywhere in the name or description, ignoring case
};

// LIKE treats % and _ as wildcards, so escape them (and the escape character)
// to make a search for "50%" match that text rather than everything.
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, "\\$&");
}

// amount comes back as text and date as "YYYY-MM-DD" so neither is shifted by
// float rounding or the server's time zone.
const columns = sql`
  id, type, name, amount::text AS amount, to_char(date, 'YYYY-MM-DD') AS date, category, description,
  recurring_id AS "recurringId"
`;

// Every query is scoped to the user, so nobody can read or change another
// user's transactions by guessing an id.
// The WHERE clause for one user's transactions matching the filters. Shared by
// the list and its summary so the two always count the same rows.
function filterWhere(userId: number, filters: TransactionFilters) {
  const pattern = filters.search ? `%${escapeLike(filters.search)}%` : "";
  return sql`
    WHERE user_id = ${userId}
      ${filters.type ? sql`AND type = ${filters.type}` : sql``}
      ${filters.category ? sql`AND category = ${filters.category}` : sql``}
      ${filters.from ? sql`AND date >= ${filters.from}` : sql``}
      ${filters.to ? sql`AND date <= ${filters.to}` : sql``}
      ${pattern ? sql`AND (name ILIKE ${pattern} ESCAPE '\\' OR description ILIKE ${pattern} ESCAPE '\\')` : sql``}
  `;
}

// One page of the matching transactions, newest first. id breaks ties between
// same-day rows so every row lands on exactly one page.
export async function listTransactions(
  userId: number,
  filters: TransactionFilters,
  page: { limit: number; offset: number },
) {
  return sql<Transaction[]>`
    SELECT ${columns} FROM transactions
     ${filterWhere(userId, filters)}
     ORDER BY date DESC, id DESC
     LIMIT ${page.limit} OFFSET ${page.offset}
  `;
}

export type TransactionSummary = {
  count: number;
  income: string;
  expenses: string;
  byCategory: { category: string; expenses: string }[];
};

// Totals across every matching transaction, not just the page being shown.
// Summed in the database and returned as text so cents are never rounded
// through a float.
export async function getTransactionSummary(
  userId: number,
  filters: TransactionFilters,
): Promise<TransactionSummary> {
  const where = filterWhere(userId, filters);
  const [[totals], byCategory] = await Promise.all([
    sql<Omit<TransactionSummary, "byCategory">[]>`
      SELECT count(*)::int AS count,
             COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::text AS income,
             COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::text AS expenses
        FROM transactions
        ${where}
    `,
    sql<TransactionSummary["byCategory"]>`
      SELECT category, SUM(amount)::text AS expenses
        FROM transactions
        ${where} AND type = 'expense'
       GROUP BY category
    `,
  ]);
  return { ...totals, byCategory };
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
