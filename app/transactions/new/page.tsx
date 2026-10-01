import type { Metadata } from "next";
import { saveTransaction } from "@/app/actions/transactions";
import { today } from "@/lib/format";
import { TransactionForm } from "../transaction-form";

export const metadata: Metadata = { title: "Add transaction · Finance Tracker" };

export default async function NewTransactionPage(props: PageProps<"/transactions/new">) {
  // ?type=income opens the form on Income; anything else starts on Expense.
  const type = (await props.searchParams).type === "income" ? "income" : "expense";

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm sm:p-8 dark:border-white/[.145] dark:bg-zinc-950">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Add transaction</h1>
      <TransactionForm
        action={saveTransaction.bind(null, null)}
        initial={{ type, name: "", amount: "", date: today(), category: "", description: "" }}
        submitLabel="Add transaction"
      />
    </div>
  );
}
