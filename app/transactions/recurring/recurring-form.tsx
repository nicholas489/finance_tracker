"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import {
  Field,
  FormMessage,
  inputClass,
  SelectField,
  SubmitButton,
  TextAreaField,
} from "@/app/(auth)/form-ui";
import type { RecurringFormState, RecurringValues } from "@/lib/recurring-form";
import { FREQUENCIES } from "@/lib/schedule";
import type { TransactionType } from "@/lib/transaction-form";

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

export function RecurringForm({
  action,
  categories,
  initial,
  submitLabel,
  editing = false,
}: {
  action: (state: RecurringFormState, formData: FormData) => Promise<RecurringFormState>;
  categories: string[];
  initial: RecurringValues;
  submitLabel: string;
  editing?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // The category field only applies to expenses, so it's hidden for income.
  const [type, setType] = useState(initial.type);
  const errors = state?.errors;

  return (
    <form
      action={formAction}
      // Submitting through onSubmit stops React from resetting the form
      // afterwards, so a failed save keeps everything the user typed.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <FormMessage message={state?.message} />

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Type</legend>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-black/[.12] p-1 dark:border-white/[.18]">
          {typeOptions.map((option) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-md py-1.5 text-center text-sm font-medium text-zinc-600 has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-2 has-focus-visible:ring-zinc-900/20 dark:text-zinc-400"
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id="name"
        name="name"
        label="Name"
        placeholder={type === "expense" ? "e.g. Rent, Netflix" : "e.g. Paycheque"}
        maxLength={100}
        required
        defaultValue={initial.name}
        errors={errors?.name}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="amount"
          name="amount"
          label="Amount ($)"
          inputMode="decimal"
          placeholder="0.00"
          required
          defaultValue={initial.amount}
          errors={errors?.amount}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="frequency" className="text-sm font-medium">
            Repeats
          </label>
          <select
            id="frequency"
            name="frequency"
            defaultValue={initial.frequency}
            aria-invalid={errors?.frequency ? true : undefined}
            className={`${inputClass} dark:bg-zinc-950`}
          >
            {Object.entries(FREQUENCIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors?.frequency && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.frequency[0]}</p>
          )}
        </div>
        <Field
          id="date"
          name="date"
          type="date"
          label="Start date"
          required
          defaultValue={initial.date}
          errors={errors?.date}
        />
        <Field
          id="endDate"
          name="endDate"
          type="date"
          label="End date (optional)"
          defaultValue={initial.endDate}
          errors={errors?.endDate}
        />
      </div>
      {type === "expense" && (
        <SelectField
          id="category"
          name="category"
          label="Category"
          placeholder="Choose a category"
          options={categories}
          defaultValue={initial.category}
          errors={errors?.category}
        />
      )}
      <TextAreaField
        id="description"
        name="description"
        label="Description (optional)"
        rows={2}
        maxLength={500}
        defaultValue={initial.description}
        errors={errors?.description}
      />

      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        {editing
          ? "Changes apply from the next date on. Transactions already added won't change."
          : "A transaction is added automatically on each date, starting with the start date. Past dates are added right away."}
      </p>

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/transactions/recurring"
          className="flex h-10 items-center justify-center rounded-lg border border-black/[.12] px-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]"
        >
          Cancel
        </Link>
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
