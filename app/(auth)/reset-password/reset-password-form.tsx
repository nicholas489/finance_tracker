"use client";

import Link from "next/link";
import { useActionState } from "react";
import { completePasswordReset } from "@/app/actions/password-reset";
import { Field, FormMessage, SubmitButton } from "../form-ui";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(completePasswordReset, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage message={state?.message} />
      {state?.message && (
        <Link href="/forgot-password" className="-mt-2 text-sm font-medium underline underline-offset-4">
          Start over
        </Link>
      )}
      <Field
        id="password"
        name="password"
        type="password"
        label="New password"
        autoComplete="new-password"
        required
        errors={state?.errors?.password}
      />
      <Field
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Confirm new password"
        autoComplete="new-password"
        required
        errors={state?.errors?.confirmPassword}
      />
      <SubmitButton pending={pending}>Reset password</SubmitButton>
    </form>
  );
}
