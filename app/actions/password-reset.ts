"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EMAIL_RE, field, type FormState } from "@/lib/form";
import { hashPassword, passwordRuleErrors, verifyPassword } from "@/lib/password";
import {
  createResetToken,
  RESET_COOKIE,
  RESET_TTL_MS,
  resetPassword,
} from "@/lib/password-reset";
import { clearFailures, isLockedOut, recordFailure } from "@/lib/rate-limit";
import { findSecurityQuestion, normalizeAnswer } from "@/lib/security-question";

const LOCKED_OUT = "Too many incorrect answers. Try again in 15 minutes.";

// The forgot password form has two steps: enter the email, then answer that
// account's security question. A hidden "step" field says which one was submitted.
export async function forgotPassword(_state: FormState, formData: FormData): Promise<FormState> {
  return field(formData, "step") === "answer"
    ? checkAnswer(formData)
    : lookUpQuestion(formData);
}

async function lookUpQuestion(formData: FormData): Promise<FormState> {
  const email = field(formData, "email").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { errors: { email: ["Enter a valid email address."] }, values: { email } };
  }

  const account = await findSecurityQuestion(email);
  if (!account) {
    return { errors: { email: ["We couldn't find an account with that email."] }, values: { email } };
  }
  if (!account.question || !account.answerHash) {
    return {
      message: "This account has no security question set up, so its password can't be reset here.",
      values: { email },
    };
  }
  if (isLockedOut(`reset:${email}`)) return { message: LOCKED_OUT, values: { email } };

  return { step: "answer", question: account.question, values: { email } };
}

async function checkAnswer(formData: FormData): Promise<FormState> {
  const email = field(formData, "email").trim().toLowerCase();
  const answer = field(formData, "answer");

  // Look the account up again: the email came back from the browser, so it
  // can't be trusted to match the question that was shown.
  const account = await findSecurityQuestion(email);
  if (!account?.question || !account.answerHash) {
    return { message: "Something went wrong. Enter your email again.", values: { email } };
  }
  const askAgain = { step: "answer", question: account.question, values: { email } } as const;

  const limitKey = `reset:${email}`;
  if (isLockedOut(limitKey)) return { ...askAgain, message: LOCKED_OUT };

  if (!normalizeAnswer(answer)) {
    return { ...askAgain, errors: { answer: ["Enter your answer."] } };
  }
  if (!(await verifyPassword(normalizeAnswer(answer), account.answerHash))) {
    recordFailure(limitKey);
    return { ...askAgain, errors: { answer: ["That answer isn't right."] } };
  }

  clearFailures(limitKey);
  // Only this browser gets the token, in a cookie scripts can't read, so it
  // never appears in a URL or the browser history.
  (await cookies()).set(RESET_COOKIE, await createResetToken(account.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: RESET_TTL_MS / 1000,
  });
  redirect("/reset-password");
}

export async function completePasswordReset(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = field(formData, "password");
  const confirmPassword = field(formData, "confirmPassword");

  const errors: NonNullable<FormState>["errors"] = {};
  const passwordErrors = passwordRuleErrors(password);
  if (passwordErrors.length) errors.password = passwordErrors;
  if (password !== confirmPassword) errors.confirmPassword = ["Passwords don't match."];
  if (errors.password || errors.confirmPassword) return { errors };

  const cookieStore = await cookies();
  const token = cookieStore.get(RESET_COOKIE)?.value;
  const email = token ? await resetPassword(token, await hashPassword(password)) : null;
  if (!email) {
    return { message: "Your reset session has expired. Start over to reset your password." };
  }

  cookieStore.delete(RESET_COOKIE);
  clearFailures(email);
  redirect("/login?reset=success");
}
