import type { Metadata } from "next";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Dashboard · Finance Tracker" };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="flex items-center justify-between border-b border-black/[.08] bg-white px-6 py-4 dark:border-white/[.145] dark:bg-zinc-950">
        <span className="font-semibold">Finance Tracker</span>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">
            {user.email}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="h-9 rounded-lg border border-black/[.12] px-4 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {user.name}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">You&apos;re signed in.</p>
      </main>
    </div>
  );
}
