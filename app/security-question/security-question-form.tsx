"use client";

import { useActionState } from "react";
import { saveSecurityQuestion } from "@/app/actions/security-question";
import { SECURITY_QUESTIONS } from "@/lib/security-questions";
import { Field, FormMessage, SelectField, SubmitButton } from "../(auth)/form-ui";

export function SecurityQuestionForm() {
  const [state, action, pending] = useActionState(saveSecurityQuestion, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormMessage message={state?.message} />
      <SelectField
        // Remount after an error so defaultValue reapplies.
        key={state?.values?.question}
        id="question"
        name="question"
        label="Question"
        options={SECURITY_QUESTIONS}
        defaultValue={state?.values?.question}
        errors={state?.errors?.question}
      />
      <Field
        id="answer"
        name="answer"
        type="password"
        label="Answer"
        autoComplete="off"
        required
        errors={state?.errors?.answer}
      />
      <Field
        id="confirmAnswer"
        name="confirmAnswer"
        type="password"
        label="Confirm answer"
        autoComplete="off"
        required
        errors={state?.errors?.confirmAnswer}
      />
      <SubmitButton pending={pending}>Save and continue</SubmitButton>
    </form>
  );
}
