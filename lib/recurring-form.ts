import { field } from "@/lib/form";
import { isFrequency, occurrence, type Frequency } from "@/lib/schedule";
import {
  isValidDate,
  parseTransactionForm,
  readTransactionValues,
  type TransactionInput,
  type TransactionValues,
} from "@/lib/transaction-form";

// What gets saved. The form's "date" field is the start date.
export type RecurringInput = Omit<TransactionInput, "date"> & {
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
};

// The form's raw text, echoed back so it keeps what the user typed after an error.
export type RecurringValues = TransactionValues & { frequency: string; endDate: string };

export type RecurringFormState =
  | {
      errors?: Partial<Record<keyof RecurringValues, string[]>>;
      message?: string;
      values?: RecurringValues;
    }
  | undefined;

// Same rules as a one-off transaction, plus the schedule. Starting further back
// than a year would add a long run of past transactions in one go, which is
// almost always a typo.
export function parseRecurringForm(
  formData: FormData,
  categories: readonly string[],
  today: string,
): { input: RecurringInput } | { state: RecurringFormState } {
  const values: RecurringValues = {
    ...readTransactionValues(formData),
    frequency: field(formData, "frequency"),
    endDate: field(formData, "endDate"),
  };

  const base = parseTransactionForm(formData, categories);
  if ("state" in base && base.state?.message) return { state: { message: base.state.message, values } };
  const errors: NonNullable<RecurringFormState>["errors"] = "state" in base ? { ...base.state?.errors } : {};

  if (!isFrequency(values.frequency)) errors.frequency = ["Choose how often it repeats."];

  if (!errors.date && values.date < occurrence(today, "yearly", -1)) {
    errors.date = ["Start date can't be more than a year ago."];
  }

  if (values.endDate) {
    if (!isValidDate(values.endDate)) errors.endDate = ["Enter a valid date, or leave it blank."];
    else if (isValidDate(values.date) && values.endDate < values.date) {
      errors.endDate = ["End date can't be before the start date."];
    }
  }

  if ("state" in base || Object.keys(errors).length) return { state: { errors, values } };

  const { date, ...rest } = base.input;
  return {
    input: {
      ...rest,
      frequency: values.frequency as Frequency,
      startDate: date,
      endDate: values.endDate || null,
    },
  };
}
