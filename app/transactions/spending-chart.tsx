import { formatMoney } from "@/lib/format";

export type CategorySpending = { category: string; cents: number };

// Past this many categories the smallest are folded into "Other", so the
// chart never needs more colours than people can tell apart.
const MAX_SLICES = 5;

// A colourblind-safe order (each colour stays distinct from the ones beside
// it), with lighter steps in dark mode. Written out in full so Tailwind sees
// every class. "Other" is always grey.
const COLORS = [
  { stroke: "stroke-[#2a78d6] dark:stroke-[#3987e5]", bg: "bg-[#2a78d6] dark:bg-[#3987e5]" },
  { stroke: "stroke-[#eb6834] dark:stroke-[#d95926]", bg: "bg-[#eb6834] dark:bg-[#d95926]" },
  { stroke: "stroke-[#1baf7a] dark:stroke-[#199e70]", bg: "bg-[#1baf7a] dark:bg-[#199e70]" },
  { stroke: "stroke-[#eda100] dark:stroke-[#c98500]", bg: "bg-[#eda100] dark:bg-[#c98500]" },
  { stroke: "stroke-[#e87ba4] dark:stroke-[#d55181]", bg: "bg-[#e87ba4] dark:bg-[#d55181]" },
];
const OTHER_COLOR = { stroke: "stroke-zinc-400 dark:stroke-zinc-500", bg: "bg-zinc-400 dark:bg-zinc-500" };

const RADIUS = 60;
const THICKNESS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Space left between slices, in the card's colour.
const GAP = 2;

// "12.3%" -> "12%", but never "0%" for a slice that's there.
function formatShare(share: number) {
  return share < 0.01 ? "<1%" : `${Math.round(share * 100)}%`;
}

// Where the shown expenses went, as a donut of categories with a legend that
// carries every name, amount and share, so nothing depends on colour alone.
export function SpendingChart({ spending }: { spending: CategorySpending[] }) {
  const sorted = [...spending].sort((a, b) => b.cents - a.cents);
  const slices =
    sorted.length > MAX_SLICES + 1
      ? [
          ...sorted.slice(0, MAX_SLICES).map((s, i) => ({ ...s, color: COLORS[i] })),
          {
            category: `Other (${sorted.length - MAX_SLICES} categories)`,
            cents: sorted.slice(MAX_SLICES).reduce((sum, s) => sum + s.cents, 0),
            color: OTHER_COLOR,
          },
        ]
      : sorted.map((s, i) => ({ ...s, color: COLORS[i] ?? OTHER_COLOR }));
  const totalCents = slices.reduce((sum, s) => sum + s.cents, 0);
  const gap = slices.length > 1 ? GAP : 0;

  // Each slice starts where the ones before it end.
  const arcs = slices.map((slice, i) => {
    const before = slices.slice(0, i).reduce((sum, s) => sum + s.cents, 0);
    return {
      ...slice,
      start: (before / totalCents) * CIRCUMFERENCE,
      length: Math.max((slice.cents / totalCents) * CIRCUMFERENCE - gap, 0),
    };
  });

  return (
    <section className="mt-6 rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-950">
      <h2 className="text-lg font-semibold">Spending by category</h2>
      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative size-40 shrink-0">
          {/* The legend lists the same numbers, so screen readers skip the drawing. */}
          <svg viewBox="0 0 160 160" className="size-full -rotate-90" aria-hidden>
            {arcs.map((arc) => (
              <circle
                key={arc.category}
                cx={80}
                cy={80}
                r={RADIUS}
                fill="none"
                strokeWidth={THICKNESS}
                strokeDasharray={`${arc.length} ${CIRCUMFERENCE}`}
                strokeDashoffset={-arc.start}
                className={`${arc.color.stroke} transition-opacity hover:opacity-80`}
              >
                <title>{`${arc.category}: ${formatMoney(arc.cents)} (${formatShare(arc.cents / totalCents)})`}</title>
              </circle>
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Spent</span>
            <span className="text-sm font-semibold tabular-nums">{formatMoney(totalCents)}</span>
          </div>
        </div>

        <ul className="flex w-full min-w-0 flex-col gap-2 text-sm">
          {slices.map((slice) => (
            <li key={slice.category} className="flex items-center gap-3">
              <span aria-hidden className={`size-3 shrink-0 rounded-sm ${slice.color.bg}`} />
              <span className="min-w-0 flex-1 truncate">{slice.category}</span>
              <span className="shrink-0 tabular-nums">{formatMoney(slice.cents)}</span>
              <span className="w-10 shrink-0 text-right text-zinc-600 tabular-nums dark:text-zinc-400">
                {formatShare(slice.cents / totalCents)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
