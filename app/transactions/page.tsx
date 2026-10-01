import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { removeTransaction } from "@/app/actions/transactions";
import { inputClass } from "@/app/(auth)/form-ui";
import { EXPENSE_CATEGORIES, isExpenseCategory } from "@/lib/categories";
import { requireUser } from "@/lib/dal";
import { formatDate, formatMoney, toCents } from "@/lib/format";
import { isTransactionType, isValidDate } from "@/lib/transaction-form";
import { listTransactions, type TransactionFilters } from "@/lib/transactions";
import { DeleteButton } from "./delete-button";

export const metadata: Metadata = { title: "Transactions · Finance Tracker" };

const buttonClass =
  "flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors";
const primaryButtonClass = `${buttonClass} bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]`;
const secondaryButtonClass = `${buttonClass} border border-black/[.12] hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]`;

// The URL can hold anything, so invalid filters are ignored rather than trusted.
function parseFilters(params: Record<string, string | string[] | undefined>): TransactionFilters {
  const get = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : "";
  };
  const type = get("type");
  const category = get("category");
  const from = get("from");
  const to = get("to");
  return {
    type: isTransactionType(type) ? type : undefined,
    category: isExpenseCategory(category) ? category : undefined,
    from: isValidDate(from) ? from : undefined,
    to: isValidDate(to) ? to : undefined,
  };
}

export default async function TransactionsPage(props: PageProps<"/transactions">) {
  const user = await requireUser();
  const filters = parseFilters(await props.searchParams);
  const transactions = await listTransactions(user.id, filters);
  const isFiltered = Object.values(filters).some(Boolean);

  let incomeCents = 0;
  let expenseCents = 0;
  for (const t of transactions) {
    if (t.type === "income") incomeCents += toCents(t.amount);
    else expenseCents += toCents(t.amount);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <div className="flex gap-2">
          <Link href="/transactions/new?type=income" className={secondaryButtonClass}>
            Add income
          </Link>
          <Link href="/transactions/new" className={primaryButtonClass}>
            Add expense
          </Link>
        </div>
      </div>

      <Form
        action="/transactions"
        // Remount when the filters change (e.g. "Clear") so the fields show them.
        key={JSON.stringify(filters)}
        className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-black/[.08] bg-white p-4 sm:grid-cols-4 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <FilterField label="From" htmlFor="from">
          <input id="from" name="from" type="date" defaultValue={filters.from} className={inputClass} />
        </FilterField>
        <FilterField label="To" htmlFor="to">
          <input id="to" name="to" type="date" defaultValue={filters.to} className={inputClass} />
        </FilterField>
        <FilterField label="Type" htmlFor="type">
          <select
            id="type"
            name="type"
            defaultValue={filters.type ?? ""}
            className={`${inputClass} dark:bg-zinc-950`}
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </FilterField>
        <FilterField label="Category" htmlFor="category">
          <select
            id="category"
            name="category"
            defaultValue={filters.category ?? ""}
            className={`${inputClass} dark:bg-zinc-950`}
          >
            <option value="">All</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </FilterField>
        <div className="col-span-2 flex justify-end gap-2 sm:col-span-4">
          {isFiltered && (
            <Link href="/transactions" className={secondaryButtonClass}>
              Clear
            </Link>
          )}
          <button type="submit" className={primaryButtonClass}>
            Apply filters
          </button>
        </div>
      </Form>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        <Total label="Income" cents={incomeCents} className="text-emerald-700 dark:text-emerald-400" />
        <Total label="Expenses" cents={expenseCents} />
        <Total label="Net" cents={incomeCents - expenseCents} />
      </dl>

      {transactions.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-black/[.12] px-6 py-12 text-center text-sm text-zinc-600 dark:border-white/[.18] dark:text-zinc-400">
          {isFiltered
            ? "No transactions match these filters."
            : "No transactions yet. Add your first expense or income to get started."}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-black/[.08] rounded-2xl border border-black/[.08] bg-white dark:divide-white/[.145] dark:border-white/[.145] dark:bg-zinc-950">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate font-medium">{t.name}</p>
                <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {formatDate(t.date)} · {t.category ?? "Income"}
                </p>
                {t.description && (
                  <p className="mt-1 text-sm break-words text-zinc-600 dark:text-zinc-400">
                    {t.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`font-medium tabular-nums ${t.type === "income" ? "text-emerald-700 dark:text-emerald-400" : ""}`}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatMoney(toCents(t.amount))}
                </span>
                <div className="flex gap-3">
                  <Link
                    href={`/transactions/${t.id}/edit`}
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteButton action={removeTransaction.bind(null, t.id)} name={t.name} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function Total({ label, cents, className = "" }: { label: string; cents: number; className?: string }) {
  return (
    <div className="rounded-2xl border border-black/[.08] bg-white px-4 py-3 dark:border-white/[.145] dark:bg-zinc-950">
      <dt className="text-xs text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className={`mt-1 truncate font-semibold tabular-nums ${className}`}>{formatMoney(cents)}</dd>
    </div>
  );
}
