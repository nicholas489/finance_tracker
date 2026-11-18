import "server-only";
import { sql } from "@/lib/db";
import type { BillFrequency, BillInput } from "@/lib/bill-form";
import { nextAfter } from "@/lib/schedule";

// dueDate is null once a one-time bill has been paid.
export type Bill = Omit<BillInput, "dueDate"> & {
  id: number;
  startDate: string;
  dueDate: string | null;
  lastPaidOn: string | null;
};

// Amounts come back as text and dates as "YYYY-MM-DD", like transactions.
const columns = sql`
  id, name, amount::text AS amount, category, frequency, remind_days AS "remindDays", notes,
  to_char(start_date, 'YYYY-MM-DD') AS "startDate",
  to_char(due_date, 'YYYY-MM-DD') AS "dueDate",
  to_char(last_paid_on, 'YYYY-MM-DD') AS "lastPaidOn"
`;

// Every query is scoped to the user, like transactions. Soonest due first,
// paid one-time bills last.
export async function listBills(userId: number) {
  return sql<Bill[]>`
    SELECT ${columns} FROM bills WHERE user_id = ${userId}
     ORDER BY due_date NULLS LAST, lower(name)
  `;
}

// Bills that are overdue or within their reminder window as of today.
export async function listDueBills(userId: number, today: string) {
  return sql<(Bill & { dueDate: string })[]>`
    SELECT ${columns} FROM bills
     WHERE user_id = ${userId} AND due_date IS NOT NULL AND due_date <= ${today}::date + remind_days
     ORDER BY due_date, lower(name)
  `;
}

export async function getBill(userId: number, id: number): Promise<Bill | null> {
  const [row] = await sql<Bill[]>`SELECT ${columns} FROM bills WHERE id = ${id} AND user_id = ${userId}`;
  return row ?? null;
}

export async function createBill(userId: number, b: BillInput) {
  await sql`
    INSERT INTO bills (user_id, name, amount, category, frequency, start_date, due_date, remind_days, notes)
    VALUES (${userId}, ${b.name}, ${b.amount}, ${b.category}, ${b.frequency}, ${b.dueDate}, ${b.dueDate},
            ${b.remindDays}, ${b.notes})
  `;
}

// The form edits the next due date. Changing it, or how often the bill
// repeats, restarts the schedule from that date; otherwise the original start
// is kept so a bill due on the 31st keeps coming back to the 31st. Saving a
// paid one-time bill unchanged leaves it paid. Returns false if it doesn't
// exist or belongs to someone else.
export async function updateBill(userId: number, id: number, b: BillInput) {
  return sql.begin(async (tx) => {
    const [old] = await tx<Pick<Bill, "startDate" | "dueDate" | "frequency">[]>`
      SELECT to_char(start_date, 'YYYY-MM-DD') AS "startDate", to_char(due_date, 'YYYY-MM-DD') AS "dueDate",
             frequency
        FROM bills WHERE id = ${id} AND user_id = ${userId} FOR UPDATE
    `;
    if (!old) return false;
    const stillPaid = old.dueDate === null && b.frequency === "once" && old.frequency === "once" && b.dueDate === old.startDate;
    const reschedule = !stillPaid && (b.dueDate !== old.dueDate || b.frequency !== old.frequency);
    await tx`
      UPDATE bills
         SET name = ${b.name}, amount = ${b.amount}, category = ${b.category}, frequency = ${b.frequency},
             remind_days = ${b.remindDays}, notes = ${b.notes},
             start_date = ${reschedule ? b.dueDate : old.startDate},
             due_date = ${stillPaid ? null : b.dueDate}
       WHERE id = ${id}
    `;
    return true;
  });
}

export type Payment = { amount: string; date: string; record: boolean };

// Marks the bill's current due date paid and moves on to the next one (a
// one-time bill is done). With record, the payment is also added as an
// expense. Paying an overdue bill only covers one due date, so a bill several
// behind stays overdue until each is paid.
export async function payBill(userId: number, id: number, payment: Payment) {
  return sql.begin(async (tx) => {
    const [bill] = await tx<Pick<Bill, "name" | "category" | "frequency" | "startDate" | "dueDate">[]>`
      SELECT name, category, frequency, to_char(start_date, 'YYYY-MM-DD') AS "startDate",
             to_char(due_date, 'YYYY-MM-DD') AS "dueDate"
        FROM bills WHERE id = ${id} AND user_id = ${userId} FOR UPDATE
    `;
    if (!bill) return "missing" as const;
    if (!bill.dueDate) return "paid" as const;

    if (payment.record) {
      await tx`
        INSERT INTO transactions (user_id, type, name, amount, date, category)
        VALUES (${userId}, 'expense', ${bill.name}, ${payment.amount}, ${payment.date}, ${bill.category})
      `;
    }
    const frequency: BillFrequency = bill.frequency;
    const next = frequency === "once" ? null : nextAfter(bill.startDate, frequency, bill.dueDate);
    await tx`UPDATE bills SET due_date = ${next}, last_paid_on = ${payment.date} WHERE id = ${id}`;
    return "ok" as const;
  });
}

export async function deleteBill(userId: number, id: number) {
  await sql`DELETE FROM bills WHERE id = ${id} AND user_id = ${userId}`;
}
