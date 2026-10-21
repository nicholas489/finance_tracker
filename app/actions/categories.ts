"use server";

import { refresh } from "next/cache";
import { parseCategoryName, type CategoryFormState } from "@/lib/categories";
import { requireUser } from "@/lib/dal";
import { createCategory, deleteCategory, renameCategory } from "@/lib/user-categories";

export async function addCategory(_state: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const user = await requireUser();

  const result = parseCategoryName(formData);
  if ("state" in result) return result.state;

  if (!(await createCategory(user.id, result.name))) {
    return { error: `You already have a category called "${result.name}".`, value: result.name };
  }
  refresh();
  return undefined;
}

// Returns an error message, or undefined once renamed. The page binds the id.
export async function editCategory(id: number, formData: FormData): Promise<string | undefined> {
  const user = await requireUser();

  const result = parseCategoryName(formData);
  if ("state" in result) return result.state?.error;

  const outcome = await renameCategory(user.id, id, result.name);
  if (outcome === "duplicate") return `You already have a category called "${result.name}".`;
  if (outcome === "missing") return "This category no longer exists. It may have been deleted.";
  refresh();
}

export async function removeCategory(id: number) {
  const user = await requireUser();
  await deleteCategory(user.id, id);
  refresh();
}
