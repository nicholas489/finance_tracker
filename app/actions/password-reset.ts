"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EMAIL_RE, field, type FormState } from "@/lib/form";
import { sendPasswordResetEmail } from "@/lib/mail";
import { hashPassword, passwordRuleErrors } from "@/lib/password";
import { createResetToken, resetPassword } from "@/lib/password-reset";
import { clearFailures, isLockedOut, recordFailure } from "@/lib/rate-limit";

// Links in emails must point at our real domain. In production that comes from
// APP_URL rather than the request's Host header, which an attacker controls.
async function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL must be set in production to send password reset links.");
  }
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function requestPasswordReset(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = field(formData, "email").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { errors: { email: ["Enter a valid email address."] }, values: { email } };
  }

  // Same response whether or not the account exists, so this form can't be
  // used to find out who is registered.
  const notice = `If an account exists for ${email}, we've sent a link to reset your password. It expires in 30 minutes.`;

  const limitKey = `reset:${email}`;
  if (isLockedOut(limitKey)) return { notice };
  recordFailure(limitKey);

  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as
    | { id: number }
    | undefined;

  if (user) {
    const url = `${await appUrl()}/reset-password?token=${createResetToken(user.id)}`;
    // Send after responding so response time doesn't reveal whether the email exists.
    after(() => sendPasswordResetEmail(email, url));
  }

  return { notice };
}

export async function completePasswordReset(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = field(formData, "token");
  const password = field(formData, "password");
  const confirmPassword = field(formData, "confirmPassword");

  const errors: NonNullable<FormState>["errors"] = {};
  const passwordErrors = passwordRuleErrors(password);
  if (passwordErrors.length) errors.password = passwordErrors;
  if (password !== confirmPassword) errors.confirmPassword = ["Passwords don't match."];
  if (errors.password || errors.confirmPassword) return { errors };

  const email = resetPassword(token, await hashPassword(password));
  if (!email) {
    return { message: "This reset link is invalid or has expired. Request a new one." };
  }

  clearFailures(email);
  redirect("/login?reset=success");
}
