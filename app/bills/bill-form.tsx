"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import {
  Field,
  FormMessage,
  inputClass,
  SelectField,
  SubmitButton,
  TextAreaField,
} from "@/app/(auth)/form-ui";
import { BILL_FREQUENCIES, REMIND_OPTIONS, type BillFormState, type BillValues } from "@/lib/bill-form";

export function BillForm({
  action,
  categories,
  initial,
  submitLabel,
}: {
  action: (state: BillFormState, formData: FormData) => Promise<BillFormState>;
  categories: string[];
  initial: BillValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
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

      <Field
        id="name"
        name="name"
        label="Name"
        placeholder="e.g. Hydro, Phone, Car insurance"
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
        <SelectField
          id="category"
          name="category"
          label="Category"
          placeholder="Choose a category"
          options={categories}
          defaultValue={initial.category}
          errors={errors?.category}
        />
        <Field
          id="dueDate"
          name="dueDate"
          type="date"
          label="Next due date"
          required
          defaultValue={initial.dueDate}
          errors={errors?.dueDate}
        />
        <Select
          id="frequency"
          label="Repeats"
          defaultValue={initial.frequency}
          errors={errors?.frequency}
          options={Object.entries(BILL_FREQUENCIES).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <Select
        id="remindDays"
        label="Remind me on the dashboard"
        defaultValue={initial.remindDays}
        errors={errors?.remindDays}
        options={REMIND_OPTIONS.map((option) => ({ value: String(option.days), label: option.label }))}
      />
      <TextAreaField
        id="notes"
        name="notes"
        label="Notes (optional)"
        placeholder="e.g. Account number, how to pay"
        rows={2}
        maxLength={500}
        defaultValue={initial.notes}
        errors={errors?.notes}
      />

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/bills"
          className="flex h-10 items-center justify-center rounded-lg border border-black/[.12] px-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]"
        >
          Cancel
        </Link>
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

// A select whose options have labels different from their values.
function Select({
  id,
  label,
  options,
  defaultValue,
  errors,
}: {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue: string;
  errors?: string[];
}) {
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={defaultValue}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errorId}
        className={`${inputClass} dark:bg-zinc-950`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errorId && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400">
          {errors![0]}
        </p>
      )}
    </div>
  );
}
