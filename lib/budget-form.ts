import { field } from "@/lib/form";
import { formatMoney, toCents } from "@/lib/format";
import { parseAmount } from "@/lib/transaction-form";

export type BudgetFormState =
  | {
      error?: string;
      // Echoed back so the form keeps what the user typed after an error.
      values?: { category: string; amount: string };
    }
  | undefined;

// categories is everything the user can file an expense under.
export function parseBudgetForm(
  formData: FormData,
  categories: readonly string[],
): { category: string; amount: string } | { state: BudgetFormState } {
  const values = { category: field(formData, "category"), amount: field(formData, "amount").trim() };
  if (!categories.includes(values.category)) return { state: { error: "Choose a category.", values } };

  const amount = parseAmount(values.amount);
  if ("error" in amount) return { state: { error: amount.error, values } };
  return { category: values.category, amount: amount.amount };
}

// A real "YYYY-MM" month, or undefined.
export function parseMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : undefined;
}

// "2026-10" moved by delta months, e.g. -1 -> "2026-09".
export function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

// The month's first and last days as "YYYY-MM-DD", inclusive.
export function monthRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10);
  return { from: `${month}-01`, to: last };
}

// How a budget is doing, in cents. left goes negative once it's overspent.
export function budgetProgress(budget: { amount: string; spent: string }) {
  const budgetCents = toCents(budget.amount);
  const spentCents = toCents(budget.spent);
  return {
    budgetCents,
    spentCents,
    leftCents: budgetCents - spentCents,
    // Share of the budget used, 0 to 1+.
    used: spentCents / budgetCents,
  };
}

// A budget warns softly once 80% is used, and hard once it's all used.
export const WARN_AT = 0.8;

export type BudgetAlertLevel = "warning" | "limit";

// used is budgetProgress().used. undefined while under 80%.
export function budgetAlertLevel(used: number): BudgetAlertLevel | undefined {
  if (used >= 1) return "limit";
  if (used >= WARN_AT) return "warning";
}

// "$280.00 left", or "Over by $20.00" once it's overspent.
export function formatLeft(leftCents: number) {
  return leftCents < 0 ? `Over by ${formatMoney(-leftCents)}` : `${formatMoney(leftCents)} left`;
}
