import { field } from "@/lib/form";
import { formatDate } from "@/lib/format";
import { daysBetween, FREQUENCIES } from "@/lib/schedule";
import { isValidDate, parseAmount } from "@/lib/transaction-form";

export const BILL_FREQUENCIES = { once: "One time", ...FREQUENCIES } as const;
export type BillFrequency = keyof typeof BILL_FREQUENCIES;

export function isBillFrequency(value: string): value is BillFrequency {
  return Object.hasOwn(BILL_FREQUENCIES, value);
}

// How many days before the due date the bill shows on the dashboard.
export const REMIND_OPTIONS = [
  { days: 0, label: "On the due date" },
  { days: 1, label: "1 day before" },
  { days: 3, label: "3 days before" },
  { days: 7, label: "1 week before" },
  { days: 14, label: "2 weeks before" },
] as const;

// What gets saved. amount is a decimal string like "12.50"; dueDate is "YYYY-MM-DD".
export type BillInput = {
  name: string;
  amount: string;
  category: string;
  frequency: BillFrequency;
  dueDate: string;
  remindDays: number;
  notes: string | null;
};

// The form's raw text, echoed back so it keeps what the user typed after an error.
export type BillValues = Record<
  "name" | "amount" | "category" | "frequency" | "dueDate" | "remindDays" | "notes",
  string
>;

export type BillFormState =
  | {
      errors?: Partial<Record<keyof BillValues, string[]>>;
      message?: string;
      values?: BillValues;
    }
  | undefined;

const NAME_MAX = 100;
const NOTES_MAX = 500;

// categories is everything the user can file an expense under.
export function parseBillForm(
  formData: FormData,
  categories: readonly string[],
): { input: BillInput } | { state: BillFormState } {
  const values: BillValues = {
    name: field(formData, "name").trim(),
    amount: field(formData, "amount").trim(),
    category: field(formData, "category"),
    frequency: field(formData, "frequency"),
    dueDate: field(formData, "dueDate"),
    remindDays: field(formData, "remindDays"),
    notes: field(formData, "notes").trim(),
  };

  const errors: NonNullable<BillFormState>["errors"] = {};
  if (!values.name) errors.name = ["Enter a name."];
  else if (values.name.length > NAME_MAX) errors.name = [`Name must be ${NAME_MAX} characters or fewer.`];

  const amount = parseAmount(values.amount);
  if ("error" in amount) errors.amount = [amount.error];

  if (!categories.includes(values.category)) errors.category = ["Choose a category."];
  if (!isBillFrequency(values.frequency)) errors.frequency = ["Choose how often it's due."];
  if (!isValidDate(values.dueDate)) errors.dueDate = ["Enter a valid date."];

  const remind = REMIND_OPTIONS.find((option) => String(option.days) === values.remindDays);
  if (!remind) errors.remindDays = ["Choose when to be reminded."];

  if (values.notes.length > NOTES_MAX) errors.notes = [`Notes must be ${NOTES_MAX} characters or fewer.`];

  if (Object.keys(errors).length || "error" in amount || !remind) return { state: { errors, values } };

  return {
    input: {
      name: values.name,
      amount: amount.amount,
      category: values.category,
      frequency: values.frequency as BillFrequency,
      dueDate: values.dueDate,
      remindDays: remind.days,
      notes: values.notes || null,
    },
  };
}

export type BillUrgency = "overdue" | "soon" | "later";

// Where a bill stands today. "soon" means it's within its reminder window,
// which is when it shows on the dashboard.
export function billUrgency(bill: { dueDate: string; remindDays: number }, today: string) {
  const daysLeft = daysBetween(today, bill.dueDate);
  const urgency: BillUrgency = daysLeft < 0 ? "overdue" : daysLeft <= bill.remindDays ? "soon" : "later";
  return { daysLeft, urgency };
}

// "Overdue by 2 days", "Due today", "Due tomorrow", "Due in 5 days" or
// "Due Dec 1, 2026" when it's further off.
export function formatDue(dueDate: string, daysLeft: number) {
  if (daysLeft < -1) return `Overdue by ${-daysLeft} days`;
  if (daysLeft === -1) return "Overdue by 1 day";
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "Due tomorrow";
  if (daysLeft <= 14) return `Due in ${daysLeft} days · ${formatDate(dueDate)}`;
  return `Due ${formatDate(dueDate)}`;
}
