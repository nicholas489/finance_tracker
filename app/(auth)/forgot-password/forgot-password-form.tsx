"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/password-reset";
import { Field, FormNotice, SubmitButton } from "../form-ui";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormNotice notice={state?.notice} />
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
      <SubmitButton pending={pending}>Send reset link</SubmitButton>
    </form>
  );
}
