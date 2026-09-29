export function Field({
  label,
  errors,
  ...input
}: { label: string; errors?: string[] } & React.InputHTMLAttributes<HTMLInputElement>) {
  const errorId = errors?.length ? `${input.id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={input.id} className="text-sm font-medium">
        {label}
      </label>
      <input
        {...input}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errorId}
        className="h-10 rounded-lg border border-black/[.12] bg-transparent px-3 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 aria-invalid:border-red-500 dark:border-white/[.18] dark:focus:border-zinc-100 dark:focus:ring-white/10"
      />
      {errors?.length ? (
        <ul id={errorId} className="text-xs text-red-600 dark:text-red-400">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
    >
      {message}
    </p>
  );
}

export function FormNotice({ notice }: { notice?: string }) {
  if (!notice) return null;
  return (
    <p
      role="status"
      className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
    >
      {notice}
    </p>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 rounded-lg bg-foreground text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
