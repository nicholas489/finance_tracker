import type { Metadata } from "next";
import Link from "next/link";
import { Total } from "@/app/total";
import { budgetProgress, monthRange, parseMonth, shiftMonth } from "@/lib/budget-form";
import { listBudgetStatus } from "@/lib/budgets";
import { requireUser } from "@/lib/dal";
import { currentMonth, formatMonth } from "@/lib/format";
import { listExpenseCategories } from "@/lib/user-categories";
import { AddBudgetForm, BudgetRow } from "./budget-forms";

export const metadata: Metadata = { title: "Budgets · Finance Tracker" };

const cardClass =
  "rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950";
const monthLinkClass =
  "flex h-9 items-center justify-center rounded-lg border border-black/[.12] px-3 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]";

export default async function BudgetsPage(props: PageProps<"/budgets">) {
  const user = await requireUser();
  const { month: monthParam } = await props.searchParams;
  const thisMonth = currentMonth();
  // The URL can hold anything, so an invalid month falls back to this one.
  const month = (typeof monthParam === "string" && parseMonth(monthParam)) || thisMonth;
  const [budgets, categories] = await Promise.all([
    listBudgetStatus(user.id, month),
    listExpenseCategories(user.id),
  ]);

  const budgeted = new Set(budgets.map((budget) => budget.category));
  const unbudgeted = categories.filter((category) => !budgeted.has(category));
  const { from, to } = monthRange(month);

  let budgetCents = 0;
  let spentCents = 0;
  for (const budget of budgets) {
    const progress = budgetProgress(budget);
    budgetCents += progress.budgetCents;
    spentCents += progress.spentCents;
  }
  const leftCents = budgetCents - spentCents;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <nav aria-label="Month" className="flex items-center gap-2">
          <Link href={`/budgets?month=${shiftMonth(month, -1)}`} className={monthLinkClass}>
            <span aria-hidden>‹</span>
            <span className="sr-only">Previous month</span>
          </Link>
          <span className="min-w-32 text-center text-sm font-medium">{formatMonth(month)}</span>
          <Link href={`/budgets?month=${shiftMonth(month, 1)}`} className={monthLinkClass}>
            <span aria-hidden>›</span>
            <span className="sr-only">Next month</span>
          </Link>
          {month !== thisMonth && (
            <Link href="/budgets" className={monthLinkClass}>
              This month
            </Link>
          )}
        </nav>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Set a monthly limit for any expense category. Each budget starts fresh on the first of the
        month.
      </p>

      {budgets.length > 0 && (
        <dl className="mt-6 grid grid-cols-3 gap-3">
          <Total label="Budgeted" cents={budgetCents} />
          <Total label="Spent" cents={spentCents} />
          <Total
            label={leftCents < 0 ? "Over budget" : "Left"}
            cents={Math.abs(leftCents)}
            className={leftCents < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}
          />
        </dl>
      )}

      {unbudgeted.length > 0 && (
        <div className={`mt-6 p-4 ${cardClass}`}>
          <AddBudgetForm categories={unbudgeted} />
        </div>
      )}

      {budgets.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-black/[.12] px-6 py-12 text-center text-sm text-zinc-600 dark:border-white/[.18] dark:text-zinc-400">
          No budgets yet. Add one above to see how much you have left to spend each month.
        </p>
      ) : (
        <ul className={`mt-6 divide-y divide-black/[.08] dark:divide-white/[.145] ${cardClass}`}>
          {budgets.map((budget) => (
            <BudgetRow
              key={budget.id}
              id={budget.id}
              category={budget.category}
              amount={budget.amount}
              spent={budget.spent}
              transactionsHref={`/transactions?${new URLSearchParams({ type: "expense", category: budget.category, from, to })}`}
            />
          ))}
        </ul>
      )}
    </>
  );
}
