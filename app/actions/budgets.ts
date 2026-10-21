"use server";

import { refresh } from "next/cache";
import { parseBudgetForm, type BudgetFormState } from "@/lib/budget-form";
import { requireUser } from "@/lib/dal";
import { field } from "@/lib/form";
import { deleteBudget, setBudget, updateBudgetAmount } from "@/lib/budgets";
import { parseAmount } from "@/lib/transaction-form";
import { listExpenseCategories } from "@/lib/user-categories";

export async function addBudget(_state: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
  const user = await requireUser();

  const result = parseBudgetForm(formData, await listExpenseCategories(user.id));
  if ("state" in result) return result.state;

  await setBudget(user.id, result.category, result.amount);
  refresh();
  return undefined;
}

// Returns an error message, or undefined once saved. The page binds the id.
export async function editBudget(id: number, formData: FormData): Promise<string | undefined> {
  const user = await requireUser();

  const result = parseAmount(field(formData, "amount"));
  if ("error" in result) return result.error;

  if (!(await updateBudgetAmount(user.id, id, result.amount))) {
    return "This budget no longer exists. It may have been deleted.";
  }
  refresh();
}

export async function removeBudget(id: number) {
  const user = await requireUser();
  await deleteBudget(user.id, id);
  refresh();
}
