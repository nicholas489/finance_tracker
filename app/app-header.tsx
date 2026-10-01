import Link from "next/link";
import { logout } from "@/app/actions/auth";

// The top bar on every signed-in page.
export function AppHeader({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-black/[.08] bg-white px-6 py-4 dark:border-white/[.145] dark:bg-zinc-950">
      <nav className="flex items-center gap-6">
        <Link href="/dashboard" className="font-semibold">
          Finance Tracker
        </Link>
        <Link
          href="/transactions"
          className="text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
        >
          Transactions
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">{email}</span>
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
  );
}
