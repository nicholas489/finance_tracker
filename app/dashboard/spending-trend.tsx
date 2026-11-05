import Link from "next/link";
import { monthRange } from "@/lib/budget-form";
import { formatMoney, formatMonth } from "@/lib/format";

export type MonthCents = { month: string; cents: number };

const shortMonth = new Intl.DateTimeFormat("en-CA", { month: "short", timeZone: "UTC" });
const compactMoney = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  notation: "compact",
});

// A round step that splits max into about three gridlines: 1, 2, 2.5 or 5 times
// a power of ten, and never less than a dollar.
function tickStep(maxCents: number) {
  const raw = Math.max(maxCents / 3, 100);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((step) => step >= raw)!;
}

// How a month's spending compares with the month before, in words and an
// arrow, so it never depends on colour alone.
function Change({ cents, previousCents }: { cents: number; previousCents: number }) {
  const diff = cents - previousCents;
  if (diff === 0) return <span className="text-zinc-600 dark:text-zinc-400">No change</span>;
  const percent = previousCents > 0 ? ` (${diff > 0 ? "+" : "−"}${Math.round((Math.abs(diff) / previousCents) * 100)}%)` : "";
  return diff > 0 ? (
    <span className="text-red-600 dark:text-red-400">
      ↑ {formatMoney(diff)} more{percent}
    </span>
  ) : (
    <span className="text-emerald-700 dark:text-emerald-400">
      ↓ {formatMoney(-diff)} less{percent}
    </span>
  );
}

// Expenses month by month, oldest first, ending with the current month.
export function SpendingTrend({ months }: { months: MonthCents[] }) {
  const maxCents = Math.max(...months.map((m) => m.cents));
  const current = months.at(-1)!.month;

  if (maxCents === 0) {
    return (
      <Card months={months}>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          No expenses in the last {months.length} months.{" "}
          <Link href="/transactions/new" className="font-medium text-foreground underline underline-offset-4">
            Add an expense
          </Link>{" "}
          to see how your spending changes over time.
        </p>
      </Card>
    );
  }

  const step = tickStep(maxCents);
  const scaleCents = Math.ceil(maxCents / step) * step;
  const ticks = Array.from({ length: scaleCents / step + 1 }, (_, i) => i * step);

  return (
    <Card months={months}>
      {/* The table below holds the same numbers, so screen readers skip the chart. */}
      <div aria-hidden className="mt-5 flex gap-3 text-xs text-zinc-500 tabular-nums">
        <div className="relative h-40 w-10 shrink-0">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 translate-y-1/2"
              style={{ bottom: `${(tick / scaleCents) * 100}%` }}
            >
              {compactMoney.format(tick / 100)}
            </span>
          ))}
        </div>
        <div className="flex-1">
          <div className="relative h-40">
            {ticks.map((tick) => (
              <div
                key={tick}
                className={`absolute inset-x-0 h-px ${tick === 0 ? "bg-black/[.2] dark:bg-white/[.25]" : "bg-black/[.06] dark:bg-white/[.1]"}`}
                style={{ bottom: `${(tick / scaleCents) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex justify-around">
              {months.map(({ month, cents }) => (
                // The whole column is the hover target, not just the bar.
                <div
                  key={month}
                  title={`${formatMonth(month)}${month === current ? " (so far)" : ""}: ${formatMoney(cents)}`}
                  className="group flex w-10 items-end justify-center"
                >
                  <div
                    className="w-6 rounded-t bg-[#2a78d6] transition-colors group-hover:bg-[#1c5cab] dark:bg-[#3987e5] dark:group-hover:bg-[#6da7ec]"
                    style={{ height: `${(cents / scaleCents) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-around">
            {months.map(({ month }) => (
              <span key={month} className={`w-10 text-center ${month === current ? "font-medium text-foreground" : ""}`}>
                {shortMonth.format(new Date(`${month}-01T00:00:00Z`))}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="mt-5 w-full text-sm">
        <caption className="sr-only">Spending per month, compared with the month before</caption>
        <thead>
          <tr className="text-left text-xs text-zinc-600 dark:text-zinc-400">
            <th scope="col" className="pb-2 font-medium">Month</th>
            <th scope="col" className="pb-2 text-right font-medium">Spent</th>
            <th scope="col" className="pb-2 pl-4 text-right font-medium">vs. month before</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[.08] dark:divide-white/[.145]">
          {/* Newest first, so this month leads. */}
          {months
            .map((m, i) => ({ ...m, previous: months[i - 1] }))
            .reverse()
            .map(({ month, cents, previous }) => {
              const { from, to } = monthRange(month);
              return (
                <tr key={month}>
                  <th scope="row" className="py-2 text-left font-normal">
                    <Link
                      href={`/transactions?${new URLSearchParams({ type: "expense", from, to })}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {formatMonth(month)}
                    </Link>
                    {month === current && <span className="text-zinc-600 dark:text-zinc-400"> (so far)</span>}
                  </th>
                  <td className="py-2 text-right tabular-nums">{formatMoney(cents)}</td>
                  <td className="py-2 pl-4 text-right tabular-nums">
                    {previous ? <Change cents={cents} previousCents={previous.cents} /> : "—"}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </Card>
  );
}

function Card({ months, children }: { months: MonthCents[]; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-950">
      <h2 className="text-lg font-semibold">Monthly spending</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {formatMonth(months[0].month)} – {formatMonth(months.at(-1)!.month)}
      </p>
      {children}
    </section>
  );
}
