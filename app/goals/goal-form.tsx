"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { Field, FormMessage, SubmitButton, TextAreaField } from "@/app/(auth)/form-ui";
import type { GoalFormState, GoalValues } from "@/lib/goal-form";

export function GoalForm({
  action,
  initial,
  minDeadline,
  submitLabel,
}: {
  action: (state: GoalFormState, formData: FormData) => Promise<GoalFormState>;
  initial: GoalValues;
  // The earliest date the date picker offers; the server checks it too.
  minDeadline?: string;
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
        label="What are you saving for?"
        placeholder="e.g. Emergency fund, Trip to Japan, New laptop"
        maxLength={100}
        required
        defaultValue={initial.name}
        errors={errors?.name}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="target"
          name="target"
          label="Target amount ($)"
          inputMode="decimal"
          placeholder="0.00"
          required
          defaultValue={initial.target}
          errors={errors?.target}
        />
        <Field
          id="deadline"
          name="deadline"
          type="date"
          label="Deadline"
          min={minDeadline}
          required
          defaultValue={initial.deadline}
          errors={errors?.deadline}
        />
      </div>
      <Field
        id="saved"
        name="saved"
        label="Saved so far ($, optional)"
        inputMode="decimal"
        placeholder="0.00"
        defaultValue={initial.saved}
        errors={errors?.saved}
      />
      <TextAreaField
        id="notes"
        name="notes"
        label="Notes (optional)"
        placeholder="e.g. Which account the money is in"
        rows={2}
        maxLength={500}
        defaultValue={initial.notes}
        errors={errors?.notes}
      />

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/goals"
          className="flex h-10 items-center justify-center rounded-lg border border-black/[.12] px-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]"
        >
          Cancel
        </Link>
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
