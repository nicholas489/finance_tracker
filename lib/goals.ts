import "server-only";
import { sql } from "@/lib/db";
import { SAVED_MAX, type GoalInput } from "@/lib/goal-form";

export type Goal = GoalInput & { id: number; startDate: string };

// Amounts come back as text and dates as "YYYY-MM-DD", like transactions.
const columns = sql`
  id, name, target::text AS target, saved::text AS saved, notes,
  to_char(start_date, 'YYYY-MM-DD') AS "startDate",
  to_char(deadline, 'YYYY-MM-DD') AS deadline
`;

// Every query is scoped to the user, like transactions. Soonest deadline first.
export async function listGoals(userId: number) {
  return sql<Goal[]>`
    SELECT ${columns} FROM savings_goals WHERE user_id = ${userId}
     ORDER BY deadline, lower(name)
  `;
}

export async function getGoal(userId: number, id: number): Promise<Goal | null> {
  const [row] = await sql<Goal[]>`SELECT ${columns} FROM savings_goals WHERE id = ${id} AND user_id = ${userId}`;
  return row ?? null;
}

// today is the start date progress is measured from.
export async function createGoal(userId: number, g: GoalInput, today: string) {
  await sql`
    INSERT INTO savings_goals (user_id, name, target, saved, start_date, deadline, notes)
    VALUES (${userId}, ${g.name}, ${g.target}, ${g.saved}, ${today}, ${g.deadline}, ${g.notes})
  `;
}

// Keeps the original start date. Returns false if it doesn't exist or belongs
// to someone else.
export async function updateGoal(userId: number, id: number, g: GoalInput) {
  const rows = await sql`
    UPDATE savings_goals
       SET name = ${g.name}, target = ${g.target}, saved = ${g.saved}, deadline = ${g.deadline}, notes = ${g.notes}
     WHERE id = ${id} AND user_id = ${userId}
  `;
  return rows.count > 0;
}

// Adds money to the goal, or takes it out when withdraw is set. Can't take out
// more than has been saved.
export async function contributeToGoal(userId: number, id: number, amount: string, withdraw: boolean) {
  return sql.begin(async (tx) => {
    const [goal] = await tx<{ saved: string }[]>`
      SELECT saved::text AS saved FROM savings_goals WHERE id = ${id} AND user_id = ${userId} FOR UPDATE
    `;
    if (!goal) return "missing" as const;
    // Worked out in numeric so cents are never rounded through a float.
    const [next] = await tx<{ saved: string }[]>`
      SELECT (${goal.saved}::numeric ${withdraw ? sql`-` : sql`+`} ${amount}::numeric)::text AS saved
    `;
    if (Number(next.saved) < 0) return "too-much" as const;
    if (Number(next.saved) > Number(SAVED_MAX)) return "too-large" as const;
    await tx`UPDATE savings_goals SET saved = ${next.saved} WHERE id = ${id}`;
    return "ok" as const;
  });
}

export async function deleteGoal(userId: number, id: number) {
  await sql`DELETE FROM savings_goals WHERE id = ${id} AND user_id = ${userId}`;
}
