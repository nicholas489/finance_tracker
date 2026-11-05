"use client";

import { useState, useTransition } from "react";
import { deactivateUser, reactivateUser } from "@/app/actions/admin";

export function UserStatusButton({ id, name, active }: { id: number; name: string; active: boolean }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const warning = `Deactivate ${name}? They'll be signed out and won't be able to sign in until reactivated.`;
          if (active && !confirm(warning)) return;
          startTransition(async () => {
            setError(await (active ? deactivateUser(id) : reactivateUser(id)));
          });
        }}
        className={`whitespace-nowrap text-sm underline-offset-4 hover:underline disabled:opacity-60 ${active ? "text-red-600 dark:text-red-400" : ""}`}
      >
        {pending ? (active ? "Deactivating…" : "Reactivating…") : active ? "Deactivate" : "Reactivate"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
