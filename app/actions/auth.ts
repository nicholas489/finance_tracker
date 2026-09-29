"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/password";
import { clearFailures, isLockedOut, recordFailure } from "@/lib/rate-limit";
import { createSession, deleteSession } from "@/lib/session";

export type FormState =
  | {
      errors?: { name?: string[]; email?: string[]; password?: string[] };
      message?: string;
      // Echoed back so the form keeps what the user typed after an error.
      values?: { name?: string; email?: string };
    }
  | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

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

  const user = db
    .prepare("SELECT id, password_hash FROM users WHERE email = ?")
    .get(email) as { id: number; password_hash: string } | undefined;

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
  const passwordErrors = [];
  if (password.length < 8) passwordErrors.push("Be at least 8 characters long.");
  if (!/[a-zA-Z]/.test(password)) passwordErrors.push("Contain at least one letter.");
  if (!/[0-9]/.test(password)) passwordErrors.push("Contain at least one number.");
  if (passwordErrors.length) errors.password = passwordErrors;
  if (errors.name || errors.email || errors.password) return { errors, values: { name, email } };

  const existing = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (existing) {
    return {
      errors: { email: ["An account with this email already exists."] },
      values: { name, email },
    };
  }

  const passwordHash = await hashPassword(password);
  const { lastInsertRowid } = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, passwordHash);

  await createSession(Number(lastInsertRowid));
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
