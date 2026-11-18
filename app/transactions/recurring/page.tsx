import type { Metadata } from "next";
import Link from "next/link";
import { removeRecurring, toggleRecurringPaused } from "@/app/actions/recurring";
import {
  cardClass,
  emptyStateClass,
  primaryButtonClass,
  rowActionClass,
} from "@/app/button-classes";
import { PendingButton } from "@/app/pending-button";
import { Total } from "@/app/total";
import { requireUser } from "@/lib/dal";
import { formatDate, formatMoney, toCents } from "@/lib/format";
import { isFinished, listRecurring, postDueRecurring } from "@/lib/recurring";
import { FREQUENCIES, monthlyCents } from "@/lib/schedule";
import { DeleteButton } from "../delete-button";
import { TransactionTabs } from "../transaction-tabs";

export const metadata: Metadata = { title: "Recurring transactions · Finance Tracker" };

export default async function RecurringPage() {
  const user = await requireUser();
  await postDueRecurring(user.id);
  const recurring = await listRecurring(user.id);

  // What the active ones come to in a typical month.
  let incomeCents = 0;
  let expenseCents = 0;
  for (const r of recurring) {
    if (r.paused || isFinished(r)) continue;
    const cents = monthlyCents(toCents(r.amount), r.frequency);
    if (r.type === "income") incomeCents += cents;
    else expenseCents += cents;
  }

  return (
    <>
      <TransactionTabs current="recurring" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Recurring transactions</h1>
        <Link href="/transactions/recurring/new" className={primaryButtonClass}>
          Add recurring
        </Link>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Rent, paycheques and subscriptions are added to your transactions automatically on each
        date, so you don&apos;t have to enter them by hand.
      </p>

      {recurring.length > 0 && (
        <dl className="mt-6 grid grid-cols-3 gap-3">
          <Total
            label="Income / month"
            cents={incomeCents}
            className="text-emerald-700 dark:text-emerald-400"
          />
          <Total label="Expenses / month" cents={expenseCents} />
          <Total label="Net / month" cents={incomeCents - expenseCents} />
        </dl>
      )}

      {recurring.length === 0 ? (
        <p className={`mt-6 ${emptyStateClass}`}>
          No recurring transactions yet. Add your rent, a subscription or your paycheque to have it
          entered for you.
        </p>
      ) : (
        <ul className={`mt-6 divide-y divide-black/[.08] dark:divide-white/[.145] ${cardClass}`}>
          {recurring.map((r) => {
            const finished = isFinished(r);
            const status = r.paused ? "Paused" : finished ? "Ended" : null;
            return (
              <li key={r.id} className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
                <div className={`min-w-0 ${status ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{r.name}</p>
                    {status && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                        {status}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {FREQUENCIES[r.frequency]} · {r.category ?? "Income"}
                    {!status && <> · Next on {formatDate(r.nextDate)}</>}
                    {r.endDate && !finished && <> · Until {formatDate(r.endDate)}</>}
                  </p>
                  {r.description && (
                    <p className="mt-1 text-sm break-words text-zinc-600 dark:text-zinc-400">
                      {r.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`font-medium tabular-nums ${r.type === "income" ? "text-emerald-700 dark:text-emerald-400" : ""}`}
                  >
                    {r.type === "income" ? "+" : "−"}
                    {formatMoney(toCents(r.amount))}
                  </span>
                  <div className="flex gap-3">
                    <Link href={`/transactions/recurring/${r.id}/edit`} className={rowActionClass}>
                      Edit
                    </Link>
                    {!finished && (
                      <form action={toggleRecurringPaused.bind(null, r.id, !r.paused)}>
                        <PendingButton
                          pendingLabel={r.paused ? "Resuming…" : "Pausing…"}
                          className={rowActionClass}
                        >
                          {r.paused ? "Resume" : "Pause"}
                        </PendingButton>
                      </form>
                    )}
                    <DeleteButton
                      action={removeRecurring.bind(null, r.id)}
                      name={r.name}
                      warning="Transactions it already added will be kept. "
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
