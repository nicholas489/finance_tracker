import type { Metadata } from "next";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { requireUser } from "@/lib/dal";
import { listCustomCategories } from "@/lib/user-categories";
import { AddCategoryForm, CustomCategoryRow } from "./category-forms";

export const metadata: Metadata = { title: "Categories · Finance Tracker" };

const cardClass =
  "rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950";

export default async function CategoriesPage() {
  const user = await requireUser();
  const custom = await listCustomCategories(user.id);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Every expense has a category. Use the defaults, or add your own so tracking fits the way
        you spend.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Your categories</h2>
        <div className={`mt-3 p-4 ${cardClass}`}>
          <AddCategoryForm />
        </div>
        {custom.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-black/[.12] px-6 py-8 text-center text-sm text-zinc-600 dark:border-white/[.18] dark:text-zinc-400">
            You haven&apos;t added any categories yet.
          </p>
        ) : (
          <ul className={`mt-3 divide-y divide-black/[.08] dark:divide-white/[.145] ${cardClass}`}>
            {custom.map((category) => (
              <CustomCategoryRow key={category.id} id={category.id} name={category.name} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Default categories</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Available to everyone. These can&apos;t be changed.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {DEFAULT_CATEGORIES.map((category) => (
            <li
              key={category}
              className="rounded-full border border-black/[.08] bg-white px-3 py-1 text-sm dark:border-white/[.145] dark:bg-zinc-950"
            >
              {category}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
