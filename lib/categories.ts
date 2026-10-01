// The categories an expense can have. Shared by the transaction form, the
// filters and the server action that validates them. Each transaction stores
// its category as text, so renaming one here leaves old transactions with the
// old name.
export const EXPENSE_CATEGORIES = [
  "Groceries",
  "Dining Out",
  "Housing",
  "Utilities",
  "Transportation",
  "Health",
  "Education",
  "Shopping",
  "Entertainment",
  "Subscriptions",
  "Travel",
  "Other",
] as const;

export function isExpenseCategory(category: string) {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(category);
}
