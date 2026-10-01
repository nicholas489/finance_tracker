import { isExpenseCategory } from "@/lib/categories";
import { field } from "@/lib/form";

export type TransactionType = "income" | "expense";

export function isTransactionType(type: string): type is TransactionType {
  return type === "income" || type === "expense";
}

// What gets saved. amount is a decimal string like "12.50" so cents are never
// rounded through a float; date is "YYYY-MM-DD".
export type TransactionInput = {
  type: TransactionType;
  name: string;
  amount: string;
  date: string;
  category: string | null;
  description: string | null;
};

// The form's raw text, echoed back so it keeps what the user typed after an error.
export type TransactionValues = Record<
  "type" | "name" | "amount" | "date" | "category" | "description",
  string
>;

export type TransactionFormState =
  | {
      errors?: Partial<Record<keyof TransactionValues, string[]>>;
      message?: string;
      values?: TransactionValues;
    }
  | undefined;

// A real calendar date in "YYYY-MM-DD" form, so "2026-02-30" is rejected.
export function isValidDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
}

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;
// The largest value numeric(12,2) holds.
const AMOUNT_MAX = 9_999_999_999.99;

export function parseTransactionForm(
  formData: FormData,
): { input: TransactionInput } | { state: TransactionFormState } {
  const values: TransactionValues = {
    type: field(formData, "type"),
    name: field(formData, "name").trim(),
    amount: field(formData, "amount").trim(),
    date: field(formData, "date"),
    category: field(formData, "category"),
    description: field(formData, "description").trim(),
  };

  if (!isTransactionType(values.type)) {
    return { state: { message: "Choose whether this is an expense or income.", values } };
  }

  const errors: NonNullable<TransactionFormState>["errors"] = {};
  if (!values.name) errors.name = ["Enter a name."];
  else if (values.name.length > NAME_MAX) errors.name = [`Name must be ${NAME_MAX} characters or fewer.`];

  // Allow "$1,200.50" as well as "1200.50".
  const amount = values.amount.replace(/^\$/, "").replaceAll(",", "");
  if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    errors.amount = ["Enter an amount greater than 0, like 12.50."];
  } else if (Number(amount) > AMOUNT_MAX) {
    errors.amount = ["That amount is too large."];
  }

  if (!isValidDate(values.date)) errors.date = ["Enter a valid date."];

  const isExpense = values.type === "expense";
  if (isExpense && !isExpenseCategory(values.category)) errors.category = ["Choose a category."];

  if (values.description.length > DESCRIPTION_MAX) {
    errors.description = [`Description must be ${DESCRIPTION_MAX} characters or fewer.`];
  }

  if (Object.keys(errors).length) return { state: { errors, values } };

  return {
    input: {
      type: values.type,
      name: values.name,
      amount,
      date: values.date,
      category: isExpense ? values.category : null,
      description: values.description || null,
    },
  };
}
