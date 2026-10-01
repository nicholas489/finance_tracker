import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/app/app-header";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Dashboard · Finance Tracker" };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <AppHeader email={user.email} />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {user.name}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">You&apos;re signed in.</p>
        <Link
          href="/transactions"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          View transactions
        </Link>
      </main>
    </div>
  );
}
