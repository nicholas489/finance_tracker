"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { markBillPaid, removeBill } from "@/app/actions/bills";
import { inputClass } from "@/app/(auth)/form-ui";
import { primaryButtonClass, rowActionClass, secondaryButtonClass } from "@/app/button-classes";
import { DeleteButton } from "@/app/transactions/delete-button";
import { BILL_FREQUENCIES, billUrgency, formatDue, type BillUrgency } from "@/lib/bill-form";
import { formatDate, formatMoney, toCents } from "@/lib/format";

type Bill = {
  id: number;
  name: string;
  amount: string;
  category: string;
  frequency: keyof typeof BILL_FREQUENCIES;
  dueDate: string | null;
  remindDays: number;
  lastPaidOn: string | null;
  notes: string | null;
};

const badgeClass: Record<Exclude<BillUrgency, "later">, string> = {
  overdue: "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-200",
  soon: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
};

// One bill in a list. "Mark paid" opens a small form underneath to confirm
// what was paid and when; the amount starts at the bill's usual amount but can
// be changed for bills that vary, like hydro. compact leaves out editing and
// deleting, for the dashboard.
export function BillRow({ bill, today, compact = false }: { bill: Bill; today: string; compact?: boolean }) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const due = bill.dueDate ? billUrgency({ dueDate: bill.dueDate, remindDays: bill.remindDays }, today) : null;
  const prefix = `pay-${bill.id}`;

  const details = [
    BILL_FREQUENCIES[bill.frequency],
    bill.category,
    due ? formatDue(bill.dueDate!, due.daysLeft) : bill.lastPaidOn && `Paid ${formatDate(bill.lastPaidOn)}`,
  ].filter(Boolean);

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <div className={`min-w-0 ${due ? "" : "opacity-60"}`}>
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{bill.name}</p>
            {due && due.urgency !== "later" && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass[due.urgency]}`}>
                {due.urgency === "overdue" ? "Overdue" : due.daysLeft === 0 ? "Due today" : "Due soon"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{details.join(" · ")}</p>
          {bill.notes && !compact && (
            <p className="mt-1 text-sm break-words text-zinc-600 dark:text-zinc-400">{bill.notes}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-medium tabular-nums">{formatMoney(toCents(bill.amount))}</span>
          {!paying && (
            <div className="flex gap-3">
              {due && (
                <button type="button" onClick={() => setPaying(true)} className={`${rowActionClass} font-medium`}>
                  Mark paid
                </button>
              )}
              {!compact && (
                <>
                  <Link href={`/bills/${bill.id}/edit`} className={rowActionClass}>
                    Edit
                  </Link>
                  <DeleteButton
                    action={removeBill.bind(null, bill.id)}
                    name={bill.name}
                    warning="Payments you've added to your transactions will be kept. "
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {paying && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await markBillPaid(bill.id, formData);
              setError(result);
              if (!result) setPaying(false);
            });
          }}
          noValidate
          aria-label={`Pay ${bill.name}`}
          className="mt-3 flex flex-col gap-3 rounded-xl border border-black/[.08] p-3 dark:border-white/[.145]"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={`${prefix}-amount`} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Amount paid ($)
              </label>
              <input
                id={`${prefix}-amount`}
                name="amount"
                inputMode="decimal"
                defaultValue={bill.amount}
                autoFocus
                className={`${inputClass} min-w-0`}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={`${prefix}-date`} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Paid on
              </label>
              <input
                id={`${prefix}-date`}
                name="date"
                type="date"
                defaultValue={today}
                className={`${inputClass} min-w-0`}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="record" defaultChecked className="size-4 shrink-0" />
            Also add it to my transactions as a {bill.category} expense
          </label>
          {error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPaying(false);
                setError(undefined);
              }}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={pending} className={primaryButtonClass}>
              {pending ? "Saving…" : "Mark paid"}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
