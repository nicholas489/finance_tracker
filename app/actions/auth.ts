"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { EMAIL_RE, field, type FormState } from "@/lib/form";
import { DUMMY_HASH, hashPassword, passwordRuleErrors, verifyPassword } from "@/lib/password";
import { clearFailures, isLockedOut, recordFailure } from "@/lib/rate-limit";
import { createSession, deleteSession } from "@/lib/session";

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email").trim().toLowerCase();
  const password = field(formData, "password");

  const errors: NonNullable<FormState>["errors"] = {};
  if (!EMAIL_RE.test(email)) errors.email = ["Enter a valid email address."];
  if (!password) errors.password = ["Enter your password."];
  if (errors.email || errors.password) return { errors, values: { email } };

  if (isLockedOut(email)) {
    return {
      message: "Too many failed attempts. Try again in 15 minutes.",
      values: { email },
    };
  }

  const [user] = await sql<{ id: number; password_hash: string }[]>`
    SELECT id, password_hash FROM users WHERE email = ${email}
  `;

  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) {
    recordFailure(email);
    return { message: "Incorrect email or password.", values: { email } };
  }

  clearFailures(email);
  await createSession(user.id);
  redirect("/dashboard");
}

export async function signup(_state: FormState, formData: FormData): Promise<FormState> {
  const name = field(formData, "name").trim();
  const email = field(formData, "email").trim().toLowerCase();
  const password = field(formData, "password");

  const errors: NonNullable<FormState>["errors"] = {};
  if (name.length < 2) errors.name = ["Name must be at least 2 characters."];
  if (!EMAIL_RE.test(email)) errors.email = ["Enter a valid email address."];
  const passwordErrors = passwordRuleErrors(password);
  if (passwordErrors.length) errors.password = passwordErrors;
  if (errors.name || errors.email || errors.password) return { errors, values: { name, email } };

  const [existing] = await sql`SELECT 1 FROM users WHERE email = ${email}`;
  if (existing) {
    return {
      errors: { email: ["An account with this email already exists."] },
      values: { name, email },
    };
  }

  const passwordHash = await hashPassword(password);
  const [user] = await sql<{ id: number }[]>`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name}, ${email}, ${passwordHash})
    RETURNING id
  `;

  await createSession(user.id);
  redirect("/security-question");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
