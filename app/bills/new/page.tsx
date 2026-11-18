import type { Metadata } from "next";
import { saveBill } from "@/app/actions/bills";
import { requireUser } from "@/lib/dal";
import { today } from "@/lib/format";
import { listExpenseCategories } from "@/lib/user-categories";
import { BillForm } from "../bill-form";

export const metadata: Metadata = { title: "Add bill · Finance Tracker" };

export default async function NewBillPage() {
  const user = await requireUser();
  const categories = await listExpenseCategories(user.id);

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm sm:p-8 dark:border-white/[.145] dark:bg-zinc-950">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Add bill</h1>
      <BillForm
        action={saveBill.bind(null, null)}
        categories={categories}
        initial={{
          name: "",
          amount: "",
          category: "",
          frequency: "monthly",
          dueDate: today(),
          remindDays: "3",
          notes: "",
        }}
        submitLabel="Add bill"
      />
    </div>
  );
}
