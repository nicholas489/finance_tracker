import "server-only";
import { sql } from "@/lib/db";

// A budget plus what's been spent in its category during one month. Amounts
// come back as text so cents are never rounded through a float.
export type BudgetStatus = { id: number; category: string; amount: string; spent: string };

// Every query is scoped to the user, like transactions. month is "YYYY-MM".
export async function listBudgetStatus(userId: number, month: string) {
  const start = `${month}-01`;
  return sql<BudgetStatus[]>`
    SELECT b.id, b.category, b.amount::text AS amount, COALESCE(s.spent, 0)::text AS spent
      FROM budgets b
      LEFT JOIN (
        SELECT category, SUM(amount) AS spent FROM transactions
         WHERE user_id = ${userId} AND type = 'expense'
           AND date >= ${start}::date AND date < ${start}::date + interval '1 month'
         GROUP BY category
      ) s ON s.category = b.category
     WHERE b.user_id = ${userId}
     ORDER BY lower(b.category)
  `;
}

// Adds a budget for the category, or replaces its amount if it already has one.
export async function setBudget(userId: number, category: string, amount: string) {
  await sql`
    INSERT INTO budgets (user_id, category, amount) VALUES (${userId}, ${category}, ${amount})
    ON CONFLICT (user_id, category) DO UPDATE SET amount = EXCLUDED.amount
  `;
}

// Returns false if the budget doesn't exist or belongs to someone else.
export async function updateBudgetAmount(userId: number, id: number, amount: string) {
  const result = await sql`UPDATE budgets SET amount = ${amount} WHERE id = ${id} AND user_id = ${userId}`;
  return result.count > 0;
}

export async function deleteBudget(userId: number, id: number) {
  await sql`DELETE FROM budgets WHERE id = ${id} AND user_id = ${userId}`;
}
