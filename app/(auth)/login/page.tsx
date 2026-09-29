import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in · Finance Tracker" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Log in to see your finances.
      </p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </>
  );
}
