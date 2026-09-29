"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "../form-ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

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
      <Field
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        errors={state?.errors?.password}
      />
      <SubmitButton pending={pending}>Log in</SubmitButton>
    </form>
  );
}
