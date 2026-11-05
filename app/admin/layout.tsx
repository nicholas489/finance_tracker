import { AppHeader } from "@/app/app-header";
import { requireAdmin } from "@/lib/dal";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <AppHeader email={user.email} isAdmin={user.isAdmin} />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
