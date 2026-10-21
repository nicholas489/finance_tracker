"use client";

import { useFormStatus } from "react-dom";

export function DeleteButton({
  action,
  name,
  warning = "",
}: {
  action: () => Promise<void>;
  name: string;
  // Extra consequences to spell out in the confirmation, ending in a space.
  warning?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(`Delete "${name}"? ${warning}This can't be undone.`)) event.preventDefault();
      }}
    >
      <Button />
    </form>
  );
}

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm text-red-600 underline-offset-4 hover:underline disabled:opacity-60 dark:text-red-400"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
