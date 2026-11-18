"use server";

import { refresh } from "next/cache";
import { parseBudgetForm, parseMonth, type BudgetFormState } from "@/lib/budget-form";
import { requireUser } from "@/lib/dal";
import { field } from "@/lib/form";
import { currentMonth } from "@/lib/format";
import { deleteBudget, setBudget, updateBudgetAmount } from "@/lib/budgets";
import { parseAmount } from "@/lib/transaction-form";
import { listExpenseCategories } from "@/lib/user-categories";

// Changes apply from the month the user is looking at onward. It comes from
// the client, so anything that isn't a real month means this one.
function readMonth(month: unknown) {
  return (typeof month === "string" && parseMonth(month)) || currentMonth();
}

export async function addBudget(_state: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
  const user = await requireUser();

  const result = parseBudgetForm(formData, await listExpenseCategories(user.id));
  if ("state" in result) return result.state;

  await setBudget(user.id, result.category, result.amount, readMonth(field(formData, "month")));
  refresh();
  return undefined;
}

// Returns an error message, or undefined once saved. The page binds the id and month.
export async function editBudget(id: number, month: string, formData: FormData): Promise<string | undefined> {
  const user = await requireUser();

  const result = parseAmount(field(formData, "amount"));
  if ("error" in result) return result.error;

  if (!(await updateBudgetAmount(user.id, id, result.amount, readMonth(month)))) {
    return "This budget no longer exists. It may have been deleted.";
  }
  refresh();
}

export async function removeBudget(id: number, month: string) {
  const user = await requireUser();
  await deleteBudget(user.id, id, readMonth(month));
  refresh();
}
