"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { field, type FormState } from "@/lib/form";
import { normalizeAnswer, setSecurityQuestion } from "@/lib/security-question";
import { isSecurityQuestion } from "@/lib/security-questions";

export async function saveSecurityQuestion(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  // Not requireUser(): it would send us straight back here.
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Changing an existing question isn't supported here; it needs re-authentication.
  if (user.hasSecurityQuestion) redirect("/dashboard");

  const question = field(formData, "question");
  const answer = field(formData, "answer");
  const confirmAnswer = field(formData, "confirmAnswer");

  const errors: NonNullable<FormState>["errors"] = {};
  if (!isSecurityQuestion(question)) errors.question = ["Choose a question from the list."];
  if (normalizeAnswer(answer).length < 2) errors.answer = ["Answer must be at least 2 characters."];
  else if (normalizeAnswer(answer) !== normalizeAnswer(confirmAnswer)) {
    errors.confirmAnswer = ["Answers don't match."];
  }
  if (errors.question || errors.answer || errors.confirmAnswer) {
    return { errors, values: { question } };
  }

  await setSecurityQuestion(user.id, question, answer);
  redirect("/dashboard");
}
