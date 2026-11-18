"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { field } from "@/lib/form";
import { today } from "@/lib/format";
import { parseGoalForm, type GoalFormState } from "@/lib/goal-form";
import { contributeToGoal, createGoal, deleteGoal, getGoal, updateGoal } from "@/lib/goals";
import { parseAmount } from "@/lib/transaction-form";

const MISSING = "This goal no longer exists. It may have been deleted.";

// Creates a goal when id is null, otherwise edits that one. The page binds the id.
export async function saveGoal(id: number | null, _state: GoalFormState, formData: FormData): Promise<GoalFormState> {
  const user = await requireUser();
  const now = today();

  let currentDeadline: string | undefined;
  if (id !== null) {
    const goal = await getGoal(user.id, id);
    if (!goal) return { message: MISSING };
    currentDeadline = goal.deadline;
  }

  const result = parseGoalForm(formData, now, currentDeadline);
  if ("state" in result) return result.state;

  if (id === null) {
    await createGoal(user.id, result.input, now);
  } else if (!(await updateGoal(user.id, id, result.input))) {
    return { message: MISSING };
  }
  redirect("/goals");
}

// Adds money to a goal, or takes it out when the form's direction is
// "withdraw". Returns an error message, or undefined once saved. The page binds the id.
export async function updateGoalSavings(id: number, formData: FormData): Promise<string | undefined> {
  const user = await requireUser();

  const amount = parseAmount(field(formData, "amount"));
  if ("error" in amount) return amount.error;
  const withdraw = field(formData, "direction") === "withdraw";

  const outcome = await contributeToGoal(user.id, id, amount.amount, withdraw);
  if (outcome === "missing") return MISSING;
  if (outcome === "too-much") return "You can't take out more than you've saved.";
  if (outcome === "too-large") return "That amount is too large.";
  refresh();
}

export async function removeGoal(id: number) {
  const user = await requireUser();
  await deleteGoal(user.id, id);
  refresh();
}
