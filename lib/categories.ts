import { field } from "@/lib/form";

// The categories every user starts with. Users can add their own on top of
// these (see lib/user-categories.ts) but can't rename or delete these. Each
// transaction stores its category as text, so renaming one here leaves old
// transactions with the old name.
export const DEFAULT_CATEGORIES = [
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

// Where a deleted custom category's transactions go.
export const FALLBACK_CATEGORY = "Other";

// The full list a user picks from: the defaults, then their own (already
// sorted), with "Other" kept last.
export function withCustomCategories(custom: readonly string[]): string[] {
  return [
    ...DEFAULT_CATEGORIES.filter((category) => category !== FALLBACK_CATEGORY),
    ...custom,
    FALLBACK_CATEGORY,
  ];
}

export function isDefaultCategory(name: string) {
  const lower = name.toLowerCase();
  return DEFAULT_CATEGORIES.some((category) => category.toLowerCase() === lower);
}

export type CategoryFormState =
  | {
      error?: string;
      // Echoed back so the field keeps what the user typed after an error.
      value?: string;
    }
  | undefined;

export const CATEGORY_NAME_MAX = 50;

export function parseCategoryName(formData: FormData): { name: string } | { state: CategoryFormState } {
  // Collapse runs of spaces so "Pet  care" and "Pet care" count as the same.
  const value = field(formData, "name").trim().replace(/\s+/g, " ");
  if (!value) return { state: { error: "Enter a category name.", value } };
  if (value.length > CATEGORY_NAME_MAX) {
    return { state: { error: `Name must be ${CATEGORY_NAME_MAX} characters or fewer.`, value } };
  }
  if (isDefaultCategory(value)) {
    return { state: { error: `"${value}" is already a default category.`, value } };
  }
  return { name: value };
}
