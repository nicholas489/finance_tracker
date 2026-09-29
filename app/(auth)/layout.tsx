import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  // Already signed in? Skip the login/signup screens.
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        {children}
      </main>
    </div>
  );
}
