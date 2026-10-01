import { AppHeader } from "@/app/app-header";
import { requireUser } from "@/lib/dal";

export default async function TransactionsLayout({ children }: LayoutProps<"/transactions">) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <AppHeader email={user.email} />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
