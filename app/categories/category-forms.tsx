"use client";

import { useActionState, useState, useTransition } from "react";
import { addCategory, editCategory, removeCategory } from "@/app/actions/categories";
import { inputClass } from "@/app/(auth)/form-ui";
import { DeleteButton } from "@/app/transactions/delete-button";
import { CATEGORY_NAME_MAX, FALLBACK_CATEGORY } from "@/lib/categories";

const buttonClass =
  "flex h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-60";
const primaryButtonClass = `${buttonClass} bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]`;
const secondaryButtonClass = `${buttonClass} border border-black/[.12] hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]`;

function NameError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
      {error}
    </p>
  );
}

export function AddCategoryForm() {
  // React resets the form after each submit, back to defaultValue: empty after
  // a success, or what the user typed after an error.
  const [state, formAction, pending] = useActionState(addCategory, undefined);

  return (
    <form action={formAction} noValidate>
      <label htmlFor="new-category" className="text-sm font-medium">
        New category
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="new-category"
          name="name"
          placeholder="e.g. Pet care"
          maxLength={CATEGORY_NAME_MAX}
          defaultValue={state?.value}
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? "new-category-error" : undefined}
          className={`${inputClass} min-w-0 flex-1`}
        />
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      <NameError id="new-category-error" error={state?.error} />
    </form>
  );
}

export function CustomCategoryRow({ id, name }: { id: number; name: string }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const inputId = `category-${id}`;

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <span className="min-w-0 truncate font-medium">{name}</span>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm underline-offset-4 hover:underline"
          >
            Rename
          </button>
          <DeleteButton
            action={removeCategory.bind(null, id)}
            name={name}
            warning={`Any expenses in it will move to "${FALLBACK_CATEGORY}". `}
          />
        </div>
      </li>
    );
  }

  return (
    <li className="px-4 py-3 sm:px-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await editCategory(id, formData);
            setError(result);
            if (!result) setEditing(false);
          });
        }}
        noValidate
      >
        <label htmlFor={inputId} className="sr-only">
          New name for {name}
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            name="name"
            defaultValue={name}
            maxLength={CATEGORY_NAME_MAX}
            autoFocus
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError(undefined);
            }}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
        <NameError id={`${inputId}-error`} error={error} />
      </form>
    </li>
  );
}
