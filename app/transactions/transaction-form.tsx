"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import {
  Field,
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
} from "@/app/(auth)/form-ui";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import type {
  TransactionFormState,
  TransactionType,
  TransactionValues,
} from "@/lib/transaction-form";

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

export function TransactionForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: TransactionFormState, formData: FormData) => Promise<TransactionFormState>;
  initial: TransactionValues;
  submitLabel: string;
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
        placeholder={type === "expense" ? "e.g. Weekly groceries" : "e.g. Part-time job"}
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
        <Field
          id="date"
          name="date"
          type="date"
          label="Date"
          required
          defaultValue={initial.date}
          errors={errors?.date}
        />
      </div>
      {type === "expense" && (
        <SelectField
          id="category"
          name="category"
          label="Category"
          placeholder="Choose a category"
          options={EXPENSE_CATEGORIES}
          defaultValue={initial.category}
          errors={errors?.category}
        />
      )}
      <TextAreaField
        id="description"
        name="description"
        label="Description (optional)"
        rows={3}
        maxLength={500}
        defaultValue={initial.description}
        errors={errors?.description}
      />

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/transactions"
          className="flex h-10 items-center justify-center rounded-lg border border-black/[.12] px-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]"
        >
          Cancel
        </Link>
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
