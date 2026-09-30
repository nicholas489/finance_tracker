import type { Metadata } from "next";
import Link from "next/link";
import { FormNotice } from "../form-ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in · Finance Tracker" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { reset } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Log in to see your finances.
      </p>
      {reset === "success" && (
        <div className="mb-4">
          <FormNotice notice="Your password has been reset. Log in with your new password." />
        </div>
      )}
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
