import "server-only";
import postgres from "postgres";
import { FALLBACK_CATEGORY, withCustomCategories } from "@/lib/categories";
import { sql } from "@/lib/db";

export type CustomCategory = { id: number; name: string };

// A user's own categories. Every query is scoped to the user, like transactions.
export async function listCustomCategories(userId: number) {
  return sql<CustomCategory[]>`
    SELECT id, name FROM categories WHERE user_id = ${userId} ORDER BY lower(name)
  `;
}

// Everything the user can file an expense under: defaults plus their own.
export async function listExpenseCategories(userId: number) {
  const custom = await listCustomCategories(userId);
  return withCustomCategories(custom.map((category) => category.name));
}

// The unique index on (user_id, lower(name)) catches duplicates, including
// two saves racing each other.
function isDuplicate(error: unknown) {
  return error instanceof postgres.PostgresError && error.code === "23505";
}

// Returns false if the user already has a category with that name.
export async function createCategory(userId: number, name: string) {
  try {
    await sql`INSERT INTO categories (user_id, name) VALUES (${userId}, ${name})`;
    return true;
  } catch (error) {
    if (isDuplicate(error)) return false;
    throw error;
  }
}

// Transactions store the category's name, so they're renamed along with it.
export async function renameCategory(
  userId: number,
  id: number,
  name: string,
): Promise<"ok" | "missing" | "duplicate"> {
  try {
    return await sql.begin(async (tx) => {
      const [old] = await tx<{ name: string }[]>`
        SELECT name FROM categories WHERE id = ${id} AND user_id = ${userId} FOR UPDATE
      `;
      if (!old) return "missing" as const;
      await tx`UPDATE categories SET name = ${name} WHERE id = ${id}`;
      await tx`
        UPDATE transactions SET category = ${name}
         WHERE user_id = ${userId} AND category = ${old.name}
      `;
      return "ok" as const;
    });
  } catch (error) {
    if (isDuplicate(error)) return "duplicate";
    throw error;
  }
}

// Expenses must keep a category, so the deleted one's move to "Other".
export async function deleteCategory(userId: number, id: number) {
  await sql.begin(async (tx) => {
    const [deleted] = await tx<{ name: string }[]>`
      DELETE FROM categories WHERE id = ${id} AND user_id = ${userId} RETURNING name
    `;
    if (!deleted) return;
    await tx`
      UPDATE transactions SET category = ${FALLBACK_CATEGORY}
       WHERE user_id = ${userId} AND category = ${deleted.name}
    `;
  });
}
