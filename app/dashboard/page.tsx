import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/app/app-header";
import { BillRow } from "@/app/bills/bill-row";
import { BudgetAlerts } from "@/app/budgets/budget-alerts";
import { BudgetBar } from "@/app/budgets/budget-bar";
import { GoalBar } from "@/app/goals/goal-bar";
import { listDueBills } from "@/lib/bills";
import { budgetProgress, formatLeft, shiftMonth } from "@/lib/budget-form";
import { listBudgetStatus } from "@/lib/budgets";
import { requireUser } from "@/lib/dal";
import { currentMonth, formatDate, formatMoney, formatMonth, toCents, today } from "@/lib/format";
import { formatPace, GOAL_STATUS_LABELS, goalProgress } from "@/lib/goal-form";
import { listGoals } from "@/lib/goals";
import { postDueRecurring } from "@/lib/recurring";
import { getMonthlySpending, getMonthTotals } from "@/lib/transactions";
import { MonthSummary } from "./month-summary";
import { SpendingTrend } from "./spending-trend";

export const metadata: Metadata = { title: "Dashboard · Finance Tracker" };

// How many months the spending trend covers, ending with this one.
const TREND_MONTHS = 6;

export default async function DashboardPage() {
  const user = await requireUser();
  const month = currentMonth();
  const todayDate = today();
  // Add recurring transactions that have come due before totalling anything.
  await postDueRecurring(user.id);
  const [budgets, totals, spending, dueBills, goals] = await Promise.all([
    listBudgetStatus(user.id, month),
    getMonthTotals(user.id, month),
    getMonthlySpending(user.id, shiftMonth(month, 1 - TREND_MONTHS), month),
    listDueBills(user.id, todayDate),
    listGoals(user.id),
  ]);
  const overdue = dueBills.filter((bill) => bill.dueDate < todayDate).length;
  // Goals still being saved for; reached and missed ones stay on the Goals page.
  const activeGoals = goals
    .map((goal) => ({ goal, progress: goalProgress(goal, todayDate) }))
    .filter(({ progress }) => progress.status === "on-track" || progress.status === "behind");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <AppHeader email={user.email} isAdmin={user.isAdmin} />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {user.name}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Here&apos;s how {formatMonth(month)} is going.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {/* Bills that are overdue or within their reminder window. */}
          {dueBills.length > 0 && (
            <section
              aria-labelledby="bill-reminders"
              className={`rounded-2xl border bg-white dark:bg-zinc-950 ${
                overdue
                  ? "border-red-300 dark:border-red-500/40"
                  : "border-amber-300 dark:border-amber-500/40"
              }`}
            >
              <div className="flex items-baseline justify-between gap-4 px-4 pt-4 sm:px-5">
                <h2 id="bill-reminders" className="text-lg font-semibold">
                  {overdue
                    ? `${overdue} overdue bill${overdue === 1 ? "" : "s"}`
                    : `${dueBills.length} bill${dueBills.length === 1 ? "" : "s"} due soon`}
                </h2>
                <Link href="/bills" className="shrink-0 text-sm underline-offset-4 hover:underline">
                  All bills
                </Link>
              </div>
              <ul className="mt-1 divide-y divide-black/[.08] dark:divide-white/[.145]">
                {dueBills.map((bill) => (
                  <BillRow key={bill.id} bill={bill} today={todayDate} compact />
                ))}
              </ul>
            </section>
          )}

          {/* Hidden when there's nothing to warn about, so it leaves no gap. */}
          <div className="empty:hidden">
            <BudgetAlerts budgets={budgets} month={month} />
          </div>

          <MonthSummary
            month={month}
            incomeCents={toCents(totals.income)}
            expenseCents={toCents(totals.expenses)}
          />

          <SpendingTrend
            months={spending.map((m) => ({ month: m.month, cents: toCents(m.expenses) }))}
          />

          <section className="rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-950">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold">Budgets · {formatMonth(month)}</h2>
              <Link href="/budgets" className="shrink-0 text-sm underline-offset-4 hover:underline">
                Manage budgets
              </Link>
            </div>
            {budgets.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                You haven&apos;t set any budgets.{" "}
                <Link href="/budgets" className="font-medium text-foreground underline underline-offset-4">
                  Set a monthly limit
                </Link>{" "}
                for a category to see how much you have left to spend.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {budgets.map((budget) => {
                  const { leftCents, used } = budgetProgress(budget);
                  const over = leftCents < 0;
                  return (
                    <li key={budget.id}>
                      <div className="mb-1.5 flex justify-between gap-4 text-sm">
                        <span className="truncate font-medium">{budget.category}</span>
                        <span
                          className={`shrink-0 tabular-nums ${over ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"}`}
                        >
                          {formatLeft(leftCents)}
                        </span>
                      </div>
                      <BudgetBar used={used} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-950">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold">Savings goals</h2>
              <Link href="/goals" className="shrink-0 text-sm underline-offset-4 hover:underline">
                {goals.length ? "All goals" : "Add a goal"}
              </Link>
            </div>
            {activeGoals.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                {goals.length ? "You don't have any goals in progress. " : "You haven't set any savings goals. "}
                <Link href="/goals/new" className="font-medium text-foreground underline underline-offset-4">
                  Set a target and deadline
                </Link>{" "}
                to track what you&apos;re saving for.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {activeGoals.map(({ goal, progress }) => (
                  <li key={goal.id}>
                    <div className="mb-1.5 flex justify-between gap-4 text-sm">
                      <span className="truncate font-medium">{goal.name}</span>
                      <span
                        className={`shrink-0 tabular-nums ${progress.status === "behind" ? "text-amber-700 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-400"}`}
                      >
                        {formatMoney(progress.savedCents)} of {formatMoney(progress.targetCents)} ·{" "}
                        {GOAL_STATUS_LABELS[progress.status]}
                      </span>
                    </div>
                    <GoalBar fraction={progress.fraction} status={progress.status} name={goal.name} />
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      By {formatDate(goal.deadline)} · {formatPace(progress)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
