"use client";

import { useActionState } from "react";
import { forgotPassword } from "@/app/actions/password-reset";
import { Field, FormMessage, SubmitButton } from "../form-ui";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPassword, undefined);

  if (state?.step === "answer") {
    return (
      <form action={action} className="flex flex-col gap-4" noValidate>
        <FormMessage message={state.message} />
        <input type="hidden" name="step" value="answer" />
        <input type="hidden" name="email" value={state.values?.email ?? ""} />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Security question</span>
          <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900">
            {state.question}
          </p>
        </div>
        <Field
          id="answer"
          name="answer"
          label="Your answer"
          autoComplete="off"
          required
          autoFocus
          errors={state.errors?.answer}
        />
        <SubmitButton pending={pending}>Verify answer</SubmitButton>
        {/* A plain link reloads the page, which clears the action state back to step 1. */}
        <a
          href="/forgot-password"
          className="-mt-1 self-center text-xs text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          Use a different email
        </a>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage message={state?.message} />
      <Field
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        errors={state?.errors?.email}
      />
      <SubmitButton pending={pending}>Continue</SubmitButton>
    </form>
  );
}
