import Link from "next/link";
import { monthRange } from "@/lib/budget-form";
import { formatMoney, formatMonth } from "@/lib/format";

// The state in words, so it never depends on the net balance's colour.
function summarize(incomeCents: number, expenseCents: number) {
  const netCents = incomeCents - expenseCents;
  if (netCents < 0) return `You've spent ${formatMoney(-netCents)} more than you've earned so far.`;
  if (netCents === 0) return "You've spent exactly what you've earned so far.";
  // Rounded down, so 99.6% doesn't read as 100%.
  return `You've spent ${Math.floor((expenseCents / incomeCents) * 100)}% of your income so far.`;
}

// This month's income against its expenses, and what's left between them.
export function MonthSummary({
  month,
  incomeCents,
  expenseCents,
}: {
  month: string;
  incomeCents: number;
  expenseCents: number;
}) {
  const netCents = incomeCents - expenseCents;
  // Amounts are always positive, so two zeros mean the month has no transactions.
  const isEmpty = incomeCents === 0 && expenseCents === 0;
  // Both bars share one scale, so the larger total fills its track.
  const scaleCents = Math.max(incomeCents, expenseCents);
  const { from, to } = monthRange(month);

  return (
    <section className="rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-950">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">Income vs. expenses · {formatMonth(month)}</h2>
        <Link
          href={`/transactions?${new URLSearchParams({ from, to })}`}
          className="shrink-0 text-sm underline-offset-4 hover:underline"
        >
          View transactions
        </Link>
      </div>

      {isEmpty ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          No income or expenses recorded for {formatMonth(month)} yet.{" "}
          <Link
            href="/transactions/new?type=income"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Add income
          </Link>{" "}
          or{" "}
          <Link href="/transactions/new" className="font-medium text-foreground underline underline-offset-4">
            add an expense
          </Link>{" "}
          to see how your month is going.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Net balance</p>
          <p
            className={`mt-1 text-4xl font-semibold tracking-tight break-words sm:text-5xl ${netCents < 0 ? "text-red-600 dark:text-red-400" : netCents > 0 ? "text-emerald-700 dark:text-emerald-400" : ""}`}
          >
            {formatMoney(netCents)}
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {summarize(incomeCents, expenseCents)}
          </p>

          <ul className="mt-5 flex flex-col gap-4">
            <TotalBar label="Income" cents={incomeCents} scaleCents={scaleCents} color="bg-emerald-600" />
            <TotalBar label="Expenses" cents={expenseCents} scaleCents={scaleCents} color="bg-blue-500" />
          </ul>
        </>
      )}
    </section>
  );
}

// The amount is printed beside the bar, so screen readers skip the bar itself.
function TotalBar({
  label,
  cents,
  scaleCents,
  color,
}: {
  label: string;
  cents: number;
  scaleCents: number;
  color: string;
}) {
  return (
    <li>
      <div className="mb-1.5 flex justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="shrink-0 tabular-nums">{formatMoney(cents)}</span>
      </div>
      <div aria-hidden className="h-2 overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.1]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(cents / scaleCents) * 100}%` }} />
      </div>
    </li>
  );
}
