import "server-only";
import { cache } from "react";
import { sql } from "@/lib/db";
import { today } from "@/lib/format";
import type { RecurringInput } from "@/lib/recurring-form";
import { addDays, firstOnOrAfter, nextAfter } from "@/lib/schedule";

export type Recurring = RecurringInput & {
  id: number;
  nextDate: string;
  lastPosted: string | null;
  paused: boolean;
};

// Amounts come back as text and dates as "YYYY-MM-DD", like transactions.
const columns = sql`
  id, type, name, amount::text AS amount, category, description, frequency,
  to_char(start_date, 'YYYY-MM-DD') AS "startDate",
  to_char(end_date, 'YYYY-MM-DD') AS "endDate",
  to_char(next_date, 'YYYY-MM-DD') AS "nextDate",
  to_char(last_posted, 'YYYY-MM-DD') AS "lastPosted",
  paused
`;

// True once every date up to the end date has been added.
export function isFinished(r: Pick<Recurring, "endDate" | "nextDate">) {
  return r.endDate !== null && r.nextDate > r.endDate;
}

// Every query is scoped to the user, like transactions.
export async function listRecurring(userId: number) {
  return sql<Recurring[]>`
    SELECT ${columns} FROM recurring_transactions
     WHERE user_id = ${userId}
     ORDER BY paused, (end_date IS NOT NULL AND next_date > end_date), next_date, lower(name)
  `;
}

export async function getRecurring(userId: number, id: number): Promise<Recurring | null> {
  const [row] = await sql<Recurring[]>`
    SELECT ${columns} FROM recurring_transactions WHERE id = ${id} AND user_id = ${userId}
  `;
  return row ?? null;
}

export async function createRecurring(userId: number, r: RecurringInput) {
  await sql`
    INSERT INTO recurring_transactions
      (user_id, type, name, amount, category, description, frequency, start_date, end_date, next_date)
    VALUES (${userId}, ${r.type}, ${r.name}, ${r.amount}, ${r.category}, ${r.description},
            ${r.frequency}, ${r.startDate}, ${r.endDate}, ${r.startDate})
  `;
}

// Transactions already added are left as they were. The next one follows the
// new schedule, after the last one added so nothing is added twice. Returns
// false if it doesn't exist or belongs to someone else.
export async function updateRecurring(userId: number, id: number, r: RecurringInput) {
  return sql.begin(async (tx) => {
    const [row] = await tx<{ lastPosted: string | null }[]>`
      SELECT to_char(last_posted, 'YYYY-MM-DD') AS "lastPosted" FROM recurring_transactions
       WHERE id = ${id} AND user_id = ${userId} FOR UPDATE
    `;
    if (!row) return false;
    const next = row.lastPosted ? nextAfter(r.startDate, r.frequency, row.lastPosted) : r.startDate;
    await tx`
      UPDATE recurring_transactions
         SET type = ${r.type}, name = ${r.name}, amount = ${r.amount}, category = ${r.category},
             description = ${r.description}, frequency = ${r.frequency}, start_date = ${r.startDate},
             end_date = ${r.endDate}, next_date = ${next}
       WHERE id = ${id}
    `;
    return true;
  });
}

// Resuming skips the dates missed while paused rather than adding them all at once.
export async function setRecurringPaused(userId: number, id: number, paused: boolean) {
  await sql.begin(async (tx) => {
    const [row] = await tx<Pick<Recurring, "startDate" | "frequency" | "lastPosted">[]>`
      SELECT to_char(start_date, 'YYYY-MM-DD') AS "startDate", frequency,
             to_char(last_posted, 'YYYY-MM-DD') AS "lastPosted"
        FROM recurring_transactions WHERE id = ${id} AND user_id = ${userId} FOR UPDATE
    `;
    if (!row) return;
    if (paused) {
      await tx`UPDATE recurring_transactions SET paused = true WHERE id = ${id}`;
      return;
    }
    const now = today();
    const from = row.lastPosted && row.lastPosted >= now ? addDays(row.lastPosted, 1) : now;
    const next = firstOnOrAfter(row.startDate, row.frequency, from);
    await tx`UPDATE recurring_transactions SET paused = false, next_date = ${next} WHERE id = ${id}`;
  });
}

// Transactions it already added are kept (their recurring_id is cleared).
export async function deleteRecurring(userId: number, id: number) {
  await sql`DELETE FROM recurring_transactions WHERE id = ${id} AND user_id = ${userId}`;
}

// Adds a transaction for every date that has come due, up to and including
// today, then moves each one's next_date on. Called before showing anything
// built from transactions, so there's no background job to run. Memoized per
// request. The row lock means two requests at once can't add the same date
// twice: the second waits, then finds next_date has moved past today.
export const postDueRecurring = cache(async (userId: number) => {
  const now = today();
  const [{ due }] = await sql<{ due: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM recurring_transactions
       WHERE user_id = ${userId} AND NOT paused AND next_date <= ${now}
         AND (end_date IS NULL OR next_date <= end_date)
    ) AS due
  `;
  if (!due) return;

  await sql.begin(async (tx) => {
    const rows = await tx<Recurring[]>`
      SELECT ${columns} FROM recurring_transactions
       WHERE user_id = ${userId} AND NOT paused AND next_date <= ${now}
         AND (end_date IS NULL OR next_date <= end_date)
       FOR UPDATE
    `;
    for (const r of rows) {
      const dates: string[] = [];
      let date = r.nextDate;
      while (date <= now && (r.endDate === null || date <= r.endDate)) {
        dates.push(date);
        date = nextAfter(r.startDate, r.frequency, date);
      }
      if (dates.length === 0) continue;

      const transactions = dates.map((d) => ({
        user_id: userId,
        type: r.type,
        name: r.name,
        amount: r.amount,
        date: d,
        category: r.category,
        description: r.description,
        recurring_id: r.id,
      }));
      await tx`INSERT INTO transactions ${tx(transactions)}`;
      await tx`
        UPDATE recurring_transactions SET next_date = ${date}, last_posted = ${dates.at(-1)!}
         WHERE id = ${r.id}
      `;
    }
  });
});
