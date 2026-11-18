"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { removeGoal, updateGoalSavings } from "@/app/actions/goals";
import { inputClass } from "@/app/(auth)/form-ui";
import { primaryButtonClass, rowActionClass, secondaryButtonClass } from "@/app/button-classes";
import { DeleteButton } from "@/app/transactions/delete-button";
import { formatDate, formatMoney } from "@/lib/format";
import { formatPace, GOAL_STATUS_LABELS, goalProgress, type GoalStatus } from "@/lib/goal-form";
import { GoalBar } from "./goal-bar";

type Goal = {
  id: number;
  name: string;
  target: string;
  saved: string;
  startDate: string;
  deadline: string;
  notes: string | null;
};

const badgeClass: Record<GoalStatus, string> = {
  reached: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200",
  "on-track": "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200",
  behind: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
  missed: "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-200",
};

// One savings goal with its progress. "Add money" opens a small form
// underneath to add to what's been saved, or take some back out.
export function GoalRow({ goal, today }: { goal: Goal; today: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const progress = goalProgress(goal, today);
  const prefix = `goal-${goal.id}`;

  return (
    <li className="px-4 py-4 sm:px-5">
      {/* Stacked on phones so a long name isn't squeezed by the amounts. */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{goal.name}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass[progress.status]}`}>
              {GOAL_STATUS_LABELS[progress.status]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">By {formatDate(goal.deadline)}</p>
        </div>
        <div className="flex items-baseline justify-between gap-2 sm:block sm:shrink-0 sm:text-right">
          <p className="font-medium tabular-nums">
            {formatMoney(progress.savedCents)}{" "}
            <span className="font-normal text-zinc-600 dark:text-zinc-400">of {formatMoney(progress.targetCents)}</span>
          </p>
          <p className="text-xs text-zinc-600 tabular-nums dark:text-zinc-400">
            {Math.floor(progress.fraction * 100)}% saved
          </p>
        </div>
      </div>

      <div className="mt-3">
        <GoalBar fraction={progress.fraction} status={progress.status} name={goal.name} />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatPace(progress)}</p>
        {!open && (
          <div className="flex gap-3">
            <button type="button" onClick={() => setOpen(true)} className={`${rowActionClass} font-medium`}>
              Add money
            </button>
            <Link href={`/goals/${goal.id}/edit`} className={rowActionClass}>
              Edit
            </Link>
            <DeleteButton action={removeGoal.bind(null, goal.id)} name={goal.name} />
          </div>
        )}
      </div>
      {goal.notes && <p className="mt-1 text-sm break-words text-zinc-600 dark:text-zinc-400">{goal.notes}</p>}

      {open && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            // Include the button that was pressed, which says add or withdraw.
            const formData = new FormData(event.currentTarget, event.nativeEvent.submitter);
            startTransition(async () => {
              const result = await updateGoalSavings(goal.id, formData);
              setError(result);
              if (!result) setOpen(false);
            });
          }}
          noValidate
          aria-label={`Update savings for ${goal.name}`}
          className="mt-3 flex flex-col gap-3 rounded-xl border border-black/[.08] p-3 dark:border-white/[.145]"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={`${prefix}-amount`} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Amount ($)
            </label>
            <input
              id={`${prefix}-amount`}
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              autoFocus
              className={`${inputClass} min-w-0`}
            />
          </div>
          {error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {/* Reversed so "Add to goal" comes first in the form, making it what
              pressing Enter does, while still showing on the right. */}
          <div className="flex flex-row-reverse flex-wrap justify-start gap-2">
            <button type="submit" name="direction" value="add" disabled={pending} className={primaryButtonClass}>
              {pending ? "Saving…" : "Add to goal"}
            </button>
            {progress.savedCents > 0 && (
              <button
                type="submit"
                name="direction"
                value="withdraw"
                disabled={pending}
                className={secondaryButtonClass}
              >
                Take out
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(undefined);
              }}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
