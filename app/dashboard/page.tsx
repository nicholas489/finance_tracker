import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/app/app-header";
import { BudgetBar } from "@/app/budgets/budget-bar";
import { budgetProgress, formatLeft } from "@/lib/budget-form";
import { listBudgetStatus } from "@/lib/budgets";
import { requireUser } from "@/lib/dal";
import { currentMonth, formatMonth } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard · Finance Tracker" };

export default async function DashboardPage() {
  const user = await requireUser();
  const month = currentMonth();
  const budgets = await listBudgetStatus(user.id, month);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <AppHeader email={user.email} />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {user.name}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">You&apos;re signed in.</p>
        <Link
          href="/transactions"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          View transactions
        </Link>

        <section className="mt-10 rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-950">
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
                    <BudgetBar used={used} over={over} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
