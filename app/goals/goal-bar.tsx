import type { GoalStatus } from "@/lib/goal-form";

const colors: Record<GoalStatus, string> = {
  reached: "bg-emerald-600 dark:bg-emerald-500",
  "on-track": "bg-emerald-600 dark:bg-emerald-500",
  behind: "bg-amber-500",
  missed: "bg-red-600 dark:bg-red-500",
};

// How much of a savings goal has been saved, colored by whether it's on pace.
export function GoalBar({ fraction, status, name }: { fraction: number; status: GoalStatus; name: string }) {
  return (
    <div
      role="progressbar"
      aria-label={`${name} saved`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(100, Math.round(fraction * 100))}
      className="h-2 overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.1]"
    >
      <div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${Math.min(fraction, 1) * 100}%` }} />
    </div>
  );
}
