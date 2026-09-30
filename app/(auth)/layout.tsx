import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { AuthCard } from "./form-ui";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  // Already signed in? Skip the login/signup screens.
  if (await getCurrentUser()) redirect("/dashboard");

  return <AuthCard>{children}</AuthCard>;
}
