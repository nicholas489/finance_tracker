import "server-only";
import type postgres from "postgres";
import { sql } from "@/lib/db";

// A budget plus what's been spent in its category during one month. Amounts
// come back as text so cents are never rounded through a float.
export type BudgetStatus = { id: number; category: string; amount: string; spent: string };

// Every query is scoped to the user, like transactions. month is "YYYY-MM".
// Each budget's limit is the latest one set on or before the month, so it
// carries over month to month; budgets set later, or removed by then, are left out.
function budgetStatus(userId: number, month: string, category?: string) {
  const start = `${month}-01`;
  return sql<BudgetStatus[]>`
    SELECT b.id, b.category, a.amount::text AS amount, COALESCE(s.spent, 0)::text AS spent
      FROM budgets b
      JOIN LATERAL (
        SELECT amount FROM budget_amounts
         WHERE budget_id = b.id AND month <= ${start}::date
         ORDER BY month DESC LIMIT 1
      ) a ON a.amount IS NOT NULL
      LEFT JOIN (
        SELECT category, SUM(amount) AS spent FROM transactions
         WHERE user_id = ${userId} AND type = 'expense'
           AND date >= ${start}::date AND date < ${start}::date + interval '1 month'
         GROUP BY category
      ) s ON s.category = b.category
     WHERE b.user_id = ${userId}
       ${category ? sql`AND b.category = ${category}` : sql``}
     ORDER BY lower(b.category)
  `;
}

export function listBudgetStatus(userId: number, month: string) {
  return budgetStatus(userId, month);
}

// One category's budget for the month, or null if it doesn't have one.
export async function getBudgetStatus(userId: number, month: string, category: string) {
  const [row] = await budgetStatus(userId, month, category);
  return row ?? null;
}

// Sets the limit from month on (null removes the budget from then on). Later
// months that were given their own limit keep it.
function setAmountFrom(tx: postgres.TransactionSql, budgetId: number, month: string, amount: string | null) {
  return tx`
    INSERT INTO budget_amounts (budget_id, month, amount) VALUES (${budgetId}, ${`${month}-01`}, ${amount})
    ON CONFLICT (budget_id, month) DO UPDATE SET amount = EXCLUDED.amount
  `;
}

// Adds a budget for the category from month on, or replaces its limit from
// then if it already has one.
export async function setBudget(userId: number, category: string, amount: string, month: string) {
  await sql.begin(async (tx) => {
    const [budget] = await tx<{ id: number }[]>`
      INSERT INTO budgets (user_id, category, amount) VALUES (${userId}, ${category}, ${amount})
      ON CONFLICT (user_id, category) DO UPDATE SET amount = EXCLUDED.amount
      RETURNING id
    `;
    await setAmountFrom(tx, budget.id, month, amount);
  });
}

// Changes the limit from month on. Returns false if the budget doesn't exist
// or belongs to someone else.
export async function updateBudgetAmount(userId: number, id: number, amount: string, month: string) {
  return sql.begin(async (tx) => {
    const updated = await tx`UPDATE budgets SET amount = ${amount} WHERE id = ${id} AND user_id = ${userId}`;
    if (updated.count === 0) return false;
    await setAmountFrom(tx, id, month, amount);
    return true;
  });
}

// Removes the budget from month on, including any limits set for later
// months; earlier months keep theirs. Once no month has it, it's deleted.
export async function deleteBudget(userId: number, id: number, month: string) {
  await sql.begin(async (tx) => {
    const [budget] = await tx`SELECT id FROM budgets WHERE id = ${id} AND user_id = ${userId} FOR UPDATE`;
    if (!budget) return;
    await tx`DELETE FROM budget_amounts WHERE budget_id = ${id} AND month > ${`${month}-01`}::date`;
    await setAmountFrom(tx, id, month, null);
    await tx`
      DELETE FROM budgets b WHERE id = ${id}
         AND NOT EXISTS (SELECT 1 FROM budget_amounts WHERE budget_id = b.id AND amount IS NOT NULL)
    `;
  });
}
