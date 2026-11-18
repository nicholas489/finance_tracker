// Link and button styles shared by the list pages.
const buttonClass =
  "flex h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-60";
export const primaryButtonClass = `${buttonClass} bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]`;
export const secondaryButtonClass = `${buttonClass} border border-black/[.12] hover:bg-black/[.04] dark:border-white/[.18] dark:hover:bg-white/[.06]`;
// A small text-only action in a list row, like "Edit".
export const rowActionClass = "text-sm underline-offset-4 hover:underline disabled:opacity-60";
export const cardClass =
  "rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950";
export const emptyStateClass =
  "rounded-2xl border border-dashed border-black/[.12] px-6 py-12 text-center text-sm text-zinc-600 dark:border-white/[.18] dark:text-zinc-400";
