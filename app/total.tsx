import { formatMoney } from "@/lib/format";

// One labelled money total in a summary <dl>.
export function Total({ label, cents, className = "" }: { label: string; cents: number; className?: string }) {
  return (
    <div className="rounded-2xl border border-black/[.08] bg-white px-4 py-3 dark:border-white/[.145] dark:bg-zinc-950">
      <dt className="text-xs text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className={`mt-1 truncate font-semibold tabular-nums ${className}`}>{formatMoney(cents)}</dd>
    </div>
  );
}
