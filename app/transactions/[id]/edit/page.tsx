import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveTransaction } from "@/app/actions/transactions";
import { requireUser } from "@/lib/dal";
import { getTransaction } from "@/lib/transactions";
import { TransactionForm } from "../../transaction-form";

export const metadata: Metadata = { title: "Edit transaction · Finance Tracker" };

export default async function EditTransactionPage(props: PageProps<"/transactions/[id]/edit">) {
  const user = await requireUser();
  const id = Number((await props.params).id);
  // Someone else's transaction looks the same as a missing one.
  const transaction = Number.isSafeInteger(id) ? await getTransaction(user.id, id) : null;
  if (!transaction) notFound();

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm sm:p-8 dark:border-white/[.145] dark:bg-zinc-950">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit transaction</h1>
      <TransactionForm
        action={saveTransaction.bind(null, transaction.id)}
        initial={{
          type: transaction.type,
          name: transaction.name,
          amount: transaction.amount,
          date: transaction.date,
          category: transaction.category ?? "",
          description: transaction.description ?? "",
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
