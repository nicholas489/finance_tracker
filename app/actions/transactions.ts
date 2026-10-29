"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { budgetAlertLevel, budgetProgress } from "@/lib/budget-form";
import { getBudgetStatus } from "@/lib/budgets";
import { requireUser } from "@/lib/dal";
import { parseTransactionForm, type TransactionFormState } from "@/lib/transaction-form";
import { createTransaction, deleteTransaction, updateTransaction } from "@/lib/transactions";
import { listExpenseCategories } from "@/lib/user-categories";

// Creates a transaction when id is null, otherwise edits that one. The page
// binds the id, so the form itself never sends it.
export async function saveTransaction(
  id: number | null,
  _state: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const user = await requireUser();

  const result = parseTransactionForm(formData, await listExpenseCategories(user.id));
  if ("state" in result) return result.state;

  if (id === null) {
    await createTransaction(user.id, result.input);
  } else if (!(await updateTransaction(user.id, id, result.input))) {
    return { message: "This transaction no longer exists. It may have been deleted." };
  }

  // If the expense leaves its budget at 80% or more for that month, the list
  // shows an alert for it.
  const { category, date } = result.input;
  if (category) {
    const month = date.slice(0, 7);
    const budget = await getBudgetStatus(user.id, month, category);
    if (budget && budgetAlertLevel(budgetProgress(budget).used)) {
      redirect(`/transactions?${new URLSearchParams({ budget: category, month })}`);
    }
  }
  redirect("/transactions");
}

export async function removeTransaction(id: number) {
  const user = await requireUser();
  await deleteTransaction(user.id, id);
  refresh();
}
