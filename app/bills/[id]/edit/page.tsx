import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveBill } from "@/app/actions/bills";
import { getBill } from "@/lib/bills";
import { requireUser } from "@/lib/dal";
import { listExpenseCategories } from "@/lib/user-categories";
import { BillForm } from "../../bill-form";

export const metadata: Metadata = { title: "Edit bill · Finance Tracker" };

export default async function EditBillPage(props: PageProps<"/bills/[id]/edit">) {
  const user = await requireUser();
  const id = Number((await props.params).id);
  // Someone else's bill looks the same as a missing one.
  const bill = Number.isSafeInteger(id) ? await getBill(user.id, id) : null;
  if (!bill) notFound();
  const categories = await listExpenseCategories(user.id);

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm sm:p-8 dark:border-white/[.145] dark:bg-zinc-950">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit bill</h1>
      <BillForm
        action={saveBill.bind(null, bill.id)}
        categories={categories}
        initial={{
          name: bill.name,
          amount: bill.amount,
          category: bill.category,
          frequency: bill.frequency,
          // A paid one-time bill shows its original date; changing it reopens the bill.
          dueDate: bill.dueDate ?? bill.startDate,
          remindDays: String(bill.remindDays),
          notes: bill.notes ?? "",
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
