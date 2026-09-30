import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, SESSION_COOKIE } from "@/lib/session";

// Checks the session against the database. Memoized per request.
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getSessionUser(token) : null;
});

// Use in pages, actions and data fetches that require a signed-in user.
// Users who haven't set up a security question are sent to do that first,
// since it's the only way they can reset a forgotten password.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.hasSecurityQuestion) redirect("/security-question");
  return user;
}
