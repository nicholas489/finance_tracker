"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { parseBillForm, type BillFormState } from "@/lib/bill-form";
import { createBill, deleteBill, payBill, updateBill } from "@/lib/bills";
import { requireUser } from "@/lib/dal";
import { field } from "@/lib/form";
import { isValidDate, parseAmount } from "@/lib/transaction-form";
import { listExpenseCategories } from "@/lib/user-categories";

// Creates a bill when id is null, otherwise edits that one. The page binds the id.
export async function saveBill(id: number | null, _state: BillFormState, formData: FormData): Promise<BillFormState> {
  const user = await requireUser();

  const result = parseBillForm(formData, await listExpenseCategories(user.id));
  if ("state" in result) return result.state;

  if (id === null) {
    await createBill(user.id, result.input);
  } else if (!(await updateBill(user.id, id, result.input))) {
    return { message: "This bill no longer exists. It may have been deleted." };
  }
  redirect("/bills");
}

// Returns an error message, or undefined once paid. The page binds the id.
export async function markBillPaid(id: number, formData: FormData): Promise<string | undefined> {
  const user = await requireUser();

  const record = formData.get("record") === "on";
  const amount = parseAmount(field(formData, "amount"));
  if ("error" in amount) return amount.error;
  const date = field(formData, "date");
  if (!isValidDate(date)) return "Enter the date you paid it.";

  const outcome = await payBill(user.id, id, { amount: amount.amount, date, record });
  if (outcome === "missing") return "This bill no longer exists. It may have been deleted.";
  if (outcome === "paid") return "This bill has already been paid.";
  refresh();
}

export async function removeBill(id: number) {
  const user = await requireUser();
  await deleteBill(user.id, id);
  refresh();
}
