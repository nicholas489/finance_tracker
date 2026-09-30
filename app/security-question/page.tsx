import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { AuthCard } from "../(auth)/form-ui";
import { SecurityQuestionForm } from "./security-question-form";

export const metadata: Metadata = { title: "Security question · Finance Tracker" };

export default async function SecurityQuestionPage() {
  // Not requireUser(): it redirects here when the question isn't set.
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.hasSecurityQuestion) redirect("/dashboard");

  return (
    <AuthCard>
      <h1 className="text-2xl font-semibold tracking-tight">Set up a security question</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        If you forget your password, you&apos;ll answer this question to reset it. Pick an answer
        only you know and won&apos;t forget. Capital letters and extra spaces don&apos;t matter.
      </p>
      <SecurityQuestionForm />
    </AuthCard>
  );
}
