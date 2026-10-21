// How much of a budget is used: green, amber from 80%, red once it's over.
export function BudgetBar({ used, over }: { used: number; over: boolean }) {
  const color = over
    ? "bg-red-600 dark:bg-red-500"
    : used >= 0.8
      ? "bg-amber-500"
      : "bg-emerald-600 dark:bg-emerald-500";
  return (
    <div
      role="progressbar"
      aria-label="Budget used"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(used * 100)}
      className="h-2 overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.1]"
    >
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(used, 1) * 100}%` }} />
    </div>
  );
}
