import type { Metadata } from "next";
import Link from "next/link";
import { cardClass, emptyStateClass, primaryButtonClass } from "@/app/button-classes";
import { Total } from "@/app/total";
import { billUrgency } from "@/lib/bill-form";
import { listBills, type Bill } from "@/lib/bills";
import { requireUser } from "@/lib/dal";
import { today as getToday, toCents } from "@/lib/format";
import { addDays, monthlyCents } from "@/lib/schedule";
import { BillRow } from "./bill-row";

export const metadata: Metadata = { title: "Bills · Finance Tracker" };

export default async function BillsPage() {
  const user = await requireUser();
  const today = getToday();
  const bills = await listBills(user.id);

  const attention: Bill[] = [];
  const upcoming: Bill[] = [];
  const paid: Bill[] = [];
  let overdueCents = 0;
  let next30Cents = 0;
  let perMonthCents = 0;
  const in30Days = addDays(today, 30);
  for (const bill of bills) {
    const cents = toCents(bill.amount);
    if (bill.frequency !== "once") perMonthCents += monthlyCents(cents, bill.frequency);
    if (!bill.dueDate) {
      paid.push(bill);
      continue;
    }
    const { urgency } = billUrgency({ dueDate: bill.dueDate, remindDays: bill.remindDays }, today);
    (urgency === "later" ? upcoming : attention).push(bill);
    if (urgency === "overdue") overdueCents += cents;
    else if (bill.dueDate <= in30Days) next30Cents += cents;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Bills</h1>
        <Link href="/bills/new" className={primaryButtonClass}>
          Add bill
        </Link>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Keep track of what&apos;s due. Bills show up on your dashboard as a reminder before they&apos;re
        due, and marking one paid can add it to your transactions.
      </p>

      {bills.length > 0 && (
        <dl className="mt-6 grid grid-cols-3 gap-3">
          <Total
            label="Overdue"
            cents={overdueCents}
            className={overdueCents > 0 ? "text-red-600 dark:text-red-400" : ""}
          />
          <Total label="Due in 30 days" cents={next30Cents} />
          <Total label="Repeating / month" cents={perMonthCents} />
        </dl>
      )}

      {bills.length === 0 ? (
        <p className={`mt-6 ${emptyStateClass}`}>
          No bills yet. Add your phone, hydro or insurance bill to be reminded before it&apos;s due.
        </p>
      ) : (
        <>
          <BillSection title="Due soon" bills={attention} today={today} />
          <BillSection title="Upcoming" bills={upcoming} today={today} />
          <BillSection title="Paid" bills={paid} today={today} />
        </>
      )}
    </>
  );
}

function BillSection({ title, bills, today }: { title: string; bills: Bill[]; today: string }) {
  if (bills.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{title}</h2>
      <ul className={`divide-y divide-black/[.08] dark:divide-white/[.145] ${cardClass}`}>
        {bills.map((bill) => (
          <BillRow key={bill.id} bill={bill} today={today} />
        ))}
      </ul>
    </section>
  );
}
