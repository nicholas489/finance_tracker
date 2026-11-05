"use server";

import { refresh } from "next/cache";
import { setUserActive } from "@/lib/admin";
import { requireAdmin } from "@/lib/dal";

// Return an error message, or undefined once done. The page binds the id.
export async function deactivateUser(id: number): Promise<string | undefined> {
  await requireAdmin();
  if (!(await setUserActive(id, false))) return "Admin accounts can't be deactivated.";
  refresh();
}

export async function reactivateUser(id: number): Promise<string | undefined> {
  await requireAdmin();
  if (!(await setUserActive(id, true))) return "This account no longer exists.";
  refresh();
}
