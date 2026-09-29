"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "../form-ui";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage message={state?.message} />
      <Field
        id="name"
        name="name"
        label="Name"
        autoComplete="name"
        required
        defaultValue={state?.values?.name}
        errors={state?.errors?.name}
      />
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
        autoComplete="new-password"
        required
        errors={state?.errors?.password}
      />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}
