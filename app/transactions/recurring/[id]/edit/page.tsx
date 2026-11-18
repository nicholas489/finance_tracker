import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveRecurring } from "@/app/actions/recurring";
import { requireUser } from "@/lib/dal";
import { getRecurring } from "@/lib/recurring";
import { listExpenseCategories } from "@/lib/user-categories";
import { RecurringForm } from "../../recurring-form";

export const metadata: Metadata = { title: "Edit recurring transaction · Finance Tracker" };

export default async function EditRecurringPage(props: PageProps<"/transactions/recurring/[id]/edit">) {
  const user = await requireUser();
  const id = Number((await props.params).id);
  // Someone else's looks the same as a missing one.
  const recurring = Number.isSafeInteger(id) ? await getRecurring(user.id, id) : null;
  if (!recurring) notFound();
  const categories = await listExpenseCategories(user.id);

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm sm:p-8 dark:border-white/[.145] dark:bg-zinc-950">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit recurring transaction</h1>
      <RecurringForm
        action={saveRecurring.bind(null, recurring.id)}
        categories={categories}
        initial={{
          type: recurring.type,
          name: recurring.name,
          amount: recurring.amount,
          date: recurring.startDate,
          category: recurring.category ?? "",
          description: recurring.description ?? "",
          frequency: recurring.frequency,
          endDate: recurring.endDate ?? "",
        }}
        submitLabel="Save changes"
        editing
      />
    </div>
  );
}
