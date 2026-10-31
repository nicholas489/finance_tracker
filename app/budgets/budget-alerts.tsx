import Link from "next/link";
import { budgetAlertLevel, budgetProgress } from "@/lib/budget-form";
import { formatMoney, formatMonth } from "@/lib/format";

type Budget = { id: number; category: string; amount: string; spent: string };

const alertClass = {
  warning:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
  limit: "border-red-300 bg-red-50 text-red-950 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100",
};

// A soft warning from 80% of a budget used, and a hard one from 100%.
// Renders nothing while the budget is under 80%.
export function BudgetAlert({ budget, month }: { budget: Budget; month: string }) {
  const { budgetCents, spentCents, leftCents, used } = budgetProgress(budget);
  const level = budgetAlertLevel(used);
  if (!level) return null;

  const spent = `${formatMoney(spentCents)} of ${formatMoney(budgetCents)} spent in ${formatMonth(month)}`;
  let title: string;
  let detail: string;
  if (level === "warning") {
    // Rounded down, so 99.6% doesn't read as 100%.
    title = `${budget.category} budget is ${Math.floor(used * 100)}% used`;
    detail = `${spent}. ${formatMoney(leftCents)} left.`;
  } else if (leftCents === 0) {
    title = `${budget.category} budget reached`;
    detail = `${spent}. Anything more will put you over.`;
  } else {
    title = `${budget.category} budget exceeded`;
    detail = `${spent}, over by ${formatMoney(-leftCents)}.`;
  }

  return (
    // The hard warning interrupts screen readers; the soft one waits its turn.
    <div
      role={level === "limit" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${alertClass[level]}`}
    >
      <AlertIcon level={level} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 tabular-nums opacity-80">{detail}</p>
      </div>
      <Link
        href={`/budgets?month=${month}`}
        className="shrink-0 font-medium underline underline-offset-4"
      >
        View budget
      </Link>
    </div>
  );
}

// Every budget at 80% or more, most used first.
export function BudgetAlerts({ budgets, month }: { budgets: Budget[]; month: string }) {
  const alerting = budgets
    .map((budget) => ({ budget, used: budgetProgress(budget).used }))
    .filter(({ used }) => budgetAlertLevel(used))
    .sort((a, b) => b.used - a.used);
  if (alerting.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {alerting.map(({ budget }) => (
        <BudgetAlert key={budget.id} budget={budget} month={month} />
      ))}
    </div>
  );
}

// A short label beside a budget: "85% used" from 80%, then "Limit reached" or
// "Over budget".
export function BudgetBadge({ used, leftCents }: { used: number; leftCents: number }) {
  const level = budgetAlertLevel(used);
  if (!level) return null;
  const label =
    level === "warning" ? `${Math.floor(used * 100)}% used` : leftCents === 0 ? "Limit reached" : "Over budget";
  const color =
    level === "warning"
      ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
      : "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-200";
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${color}`}>{label}</span>
  );
}

function AlertIcon({ level }: { level: "warning" | "limit" }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="mt-0.5 size-4 shrink-0">
      {level === "warning" ? (
        // Triangle with an exclamation mark.
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      ) : (
        // Circle with an exclamation mark.
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
}
