"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { today } from "@/lib/format";
import { parseRecurringForm, type RecurringFormState } from "@/lib/recurring-form";
import { createRecurring, deleteRecurring, setRecurringPaused, updateRecurring } from "@/lib/recurring";
import { listExpenseCategories } from "@/lib/user-categories";

// Creates one when id is null, otherwise edits that one. The page binds the id.
export async function saveRecurring(
  id: number | null,
  _state: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  const user = await requireUser();

  const result = parseRecurringForm(formData, await listExpenseCategories(user.id), today());
  if ("state" in result) return result.state;

  if (id === null) {
    await createRecurring(user.id, result.input);
  } else if (!(await updateRecurring(user.id, id, result.input))) {
    return { message: "This recurring transaction no longer exists. It may have been deleted." };
  }
  // The list page adds anything already due, e.g. one starting today.
  redirect("/transactions/recurring");
}

export async function toggleRecurringPaused(id: number, paused: boolean) {
  const user = await requireUser();
  await setRecurringPaused(user.id, id, paused);
  refresh();
}

export async function removeRecurring(id: number) {
  const user = await requireUser();
  await deleteRecurring(user.id, id);
  refresh();
}
