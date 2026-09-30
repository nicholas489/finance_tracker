import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { isResetTokenValid, RESET_COOKIE } from "@/lib/password-reset";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password · Finance Tracker" };

export default async function ResetPasswordPage() {
  // Set by the forgot password form once the security answer is verified.
  const token = (await cookies()).get(RESET_COOKIE)?.value;

  if (!token || !(await isResetTokenValid(token))) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Session expired</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          To choose a new password, answer your security question first. After you answer it, you
          have 10 minutes to set your new password.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 flex h-10 items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Start over
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        You&apos;ll be signed out on all devices once it&apos;s changed.
      </p>
      <ResetPasswordForm />
    </>
  );
}
