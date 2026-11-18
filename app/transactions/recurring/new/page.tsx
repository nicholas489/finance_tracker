import type { Metadata } from "next";
import { saveRecurring } from "@/app/actions/recurring";
import { requireUser } from "@/lib/dal";
import { today } from "@/lib/format";
import { listExpenseCategories } from "@/lib/user-categories";
import { RecurringForm } from "../recurring-form";

export const metadata: Metadata = { title: "Add recurring transaction · Finance Tracker" };

export default async function NewRecurringPage() {
  const user = await requireUser();
  const categories = await listExpenseCategories(user.id);

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm sm:p-8 dark:border-white/[.145] dark:bg-zinc-950">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Add recurring transaction</h1>
      <RecurringForm
        action={saveRecurring.bind(null, null)}
        categories={categories}
        initial={{
          type: "expense",
          name: "",
          amount: "",
          date: today(),
          category: "",
          description: "",
          frequency: "monthly",
          endDate: "",
        }}
        submitLabel="Add recurring"
      />
    </div>
  );
}
