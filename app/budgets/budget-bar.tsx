import { budgetAlertLevel } from "@/lib/budget-form";

// How much of a budget is used: green, amber from 80%, red once it's all used,
// matching the budget alerts.
export function BudgetBar({ used }: { used: number }) {
  const level = budgetAlertLevel(used);
  const color =
    level === "limit"
      ? "bg-red-600 dark:bg-red-500"
      : level === "warning"
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
