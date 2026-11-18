"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState, useTransition } from "react";
import { addBudget, editBudget, removeBudget } from "@/app/actions/budgets";
import { inputClass } from "@/app/(auth)/form-ui";
import { DeleteButton } from "@/app/transactions/delete-button";
import { budgetProgress, formatLeft, type BudgetFormState } from "@/lib/budget-form";
import { formatMoney, formatMonth } from "@/lib/format";
import { BudgetBadge } from "./budget-alerts";
import { BudgetBar } from "./budget-bar";

const buttonClass =
  "flex h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-60";
const primaryButtonClass = `${buttonClass} bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]`;
const secondaryButtonClass = `${buttonClass} border border-black/[.12] hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]`;

function FormError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
      {error}
    </p>
  );
}

// categories are the ones without a budget in month yet. The budget starts in
// month and carries over to the months after it.
export function AddBudgetForm({ categories, month }: { categories: string[]; month: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: BudgetFormState, formData: FormData) => {
      const result = await addBudget(prev, formData);
      // Only clear the fields once the budget is saved.
      if (!result) formRef.current?.reset();
      return result;
    },
    undefined,
  );
  const describedBy = state?.error ? "new-budget-error" : undefined;

  return (
    <form
      ref={formRef}
      action={formAction}
      // Submitting through onSubmit stops React from resetting the form
      // afterwards, so a failed save keeps the category and amount the user
      // entered (a reset sends the dropdown back to its first option).
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      noValidate
    >
      <input type="hidden" name="month" value={month} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="new-budget-category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="new-budget-category"
            name="category"
            className={`${inputClass} dark:bg-zinc-950`}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="new-budget-amount" className="text-sm font-medium">
            Monthly limit
          </label>
          <input
            id="new-budget-amount"
            name="amount"
            inputMode="decimal"
            placeholder="e.g. 400.00"
            aria-invalid={state?.error ? true : undefined}
            aria-describedby={describedBy}
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Adding…" : "Add budget"}
        </button>
      </div>
      <FormError id="new-budget-error" error={state?.error} />
    </form>
  );
}

// Editing or deleting applies from month onward; earlier months keep their limit.
export function BudgetRow({
  id,
  category,
  amount,
  spent,
  month,
  transactionsHref,
}: {
  id: number;
  category: string;
  amount: string;
  spent: string;
  month: string;
  // This month's expenses in the category.
  transactionsHref: string;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const { budgetCents, spentCents, leftCents, used } = budgetProgress({ amount, spent });
  const over = leftCents < 0;
  const inputId = `budget-${id}`;

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link href={transactionsHref} className="truncate font-medium underline-offset-4 hover:underline">
              {category}
            </Link>
            <BudgetBadge used={used} leftCents={leftCents} />
          </div>
          <p className="mt-0.5 text-xs text-zinc-600 tabular-nums dark:text-zinc-400">
            {formatMoney(spentCents)} spent of {formatMoney(budgetCents)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`font-medium tabular-nums ${over ? "text-red-600 dark:text-red-400" : ""}`}>
            {formatLeft(leftCents)}
          </span>
          {!editing && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm underline-offset-4 hover:underline"
              >
                Edit
              </button>
              <DeleteButton
                action={removeBudget.bind(null, id, month)}
                name={`${category} budget`}
                warning={`It will be removed from ${formatMonth(month)} onward; earlier months keep it. Your expenses won't be affected. `}
              />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3">
        <BudgetBar used={used} />
      </div>
      {editing && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await editBudget(id, month, formData);
              setError(result);
              if (!result) setEditing(false);
            });
          }}
          noValidate
          className="mt-3"
        >
          <label htmlFor={inputId} className="sr-only">
            New monthly limit for {category}
          </label>
          <div className="flex gap-2">
            <input
              id={inputId}
              name="amount"
              inputMode="decimal"
              defaultValue={amount}
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${inputId}-error` : undefined}
              className={`${inputClass} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(undefined);
              }}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={pending} className={primaryButtonClass}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
          <FormError id={`${inputId}-error`} error={error} />
          {!error && (
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              Applies to {formatMonth(month)} and the months after it. Earlier months keep their limit.
            </p>
          )}
        </form>
      )}
    </li>
  );
}
