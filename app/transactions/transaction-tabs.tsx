import Link from "next/link";

const tabs = [
  { key: "all", href: "/transactions", label: "All transactions" },
  { key: "recurring", href: "/transactions/recurring", label: "Recurring" },
] as const;

// Switches between the transaction list and the recurring ones.
export function TransactionTabs({ current }: { current: (typeof tabs)[number]["key"] }) {
  return (
    <nav aria-label="Transactions" className="mb-6 flex gap-1 border-b border-black/[.08] dark:border-white/[.145]">
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-zinc-600 hover:text-foreground dark:text-zinc-400"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
