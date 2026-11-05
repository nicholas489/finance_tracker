import type { Metadata } from "next";
import { listUsers } from "@/lib/admin";
import { requireAdmin } from "@/lib/dal";
import { formatTimestamp } from "@/lib/format";
import { UserStatusButton } from "./user-status-button";

export const metadata: Metadata = { title: "Users · Finance Tracker" };

export default async function AdminUsersPage() {
  // The layout checks too, but pages can render without it on client navigation.
  const admin = await requireAdmin();
  const users = await listUsers();
  const deactivated = users.filter((user) => user.deactivatedAt).length;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {users.length} {users.length === 1 ? "account" : "accounts"}, {deactivated} deactivated.
        Deactivated users are signed out and can&apos;t sign in or reset their password. Their data
        is kept, and reactivating them restores access.
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/[.08] text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium sm:px-5">User</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Transactions</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 sm:px-5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[.08] dark:divide-white/[.145]">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 sm:px-5">
                  <div className="font-medium">
                    {user.name}
                    {user.id === admin.id && (
                      <span className="text-zinc-600 dark:text-zinc-400"> (you)</span>
                    )}
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400">{user.email}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{formatTimestamp(user.createdAt)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{user.transactionCount}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge isAdmin={user.isAdmin} deactivatedAt={user.deactivatedAt} />
                </td>
                <td className="px-4 py-3 text-right sm:px-5">
                  {/* Admins can't be deactivated, so there's nothing to do for them. */}
                  {!user.isAdmin && (
                    <UserStatusButton
                      id={user.id}
                      name={user.name}
                      active={!user.deactivatedAt}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StatusBadge({ isAdmin, deactivatedAt }: { isAdmin: boolean; deactivatedAt: Date | null }) {
  const badge = "rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (deactivatedAt) {
    return (
      <span
        className={`${badge} bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300`}
        title={`Deactivated ${formatTimestamp(deactivatedAt)}`}
      >
        Deactivated
      </span>
    );
  }
  if (isAdmin) {
    return <span className={`${badge} bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200`}>Admin</span>;
  }
  return (
    <span className={`${badge} bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300`}>
      Active
    </span>
  );
}
