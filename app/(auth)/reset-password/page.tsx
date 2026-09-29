import type { Metadata } from "next";
import Link from "next/link";
import { isResetTokenValid } from "@/lib/password-reset";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password · Finance Tracker",
  // Keep the token in this page's URL from leaking to other sites via Referer.
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;

  if (typeof token !== "string" || !isResetTokenValid(token)) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Link expired</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This password reset link is invalid or has expired. Reset links work once and last 30
          minutes.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 flex h-10 items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Request a new link
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
      <ResetPasswordForm token={token} />
    </>
  );
}
