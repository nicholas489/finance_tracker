// Date math for things that repeat: recurring transactions and bills. Dates
// are "YYYY-MM-DD" strings, worked on as UTC so the day never shifts.

export const FREQUENCIES = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Every 3 months",
  yearly: "Yearly",
} as const;

export type Frequency = keyof typeof FREQUENCIES;

export function isFrequency(value: string): value is Frequency {
  return Object.hasOwn(FREQUENCIES, value);
}

const STEP_DAYS: Partial<Record<Frequency, number>> = { weekly: 7, biweekly: 14 };
const STEP_MONTHS: Partial<Record<Frequency, number>> = { monthly: 1, quarterly: 3, yearly: 12 };

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

function format(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const { y, m, d } = parts(date);
  return format(new Date(Date.UTC(y, m - 1, d + days)));
}

// Whole days from `from` to `to`; negative when `to` is earlier.
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

// The k-th date of a schedule that starts on `start` (k = 0 is start itself;
// k may be negative). A monthly date past the end of a shorter month lands on
// its last day, so one starting Jan 31 goes Feb 28, Mar 31, Apr 30, …
export function occurrence(start: string, frequency: Frequency, k: number) {
  const { y, m, d } = parts(start);
  const days = STEP_DAYS[frequency];
  if (days) return format(new Date(Date.UTC(y, m - 1, d + k * days)));
  const month = m - 1 + k * STEP_MONTHS[frequency]!;
  const lastDay = new Date(Date.UTC(y, month + 1, 0)).getUTCDate();
  return format(new Date(Date.UTC(y, month, Math.min(d, lastDay))));
}

// The schedule's first date on or after `date`.
export function firstOnOrAfter(start: string, frequency: Frequency, date: string) {
  if (date <= start) return start;
  const days = STEP_DAYS[frequency];
  let k: number;
  if (days) {
    k = Math.floor(daysBetween(start, date) / days);
  } else {
    const a = parts(start);
    const b = parts(date);
    k = Math.floor(((b.y - a.y) * 12 + b.m - a.m) / STEP_MONTHS[frequency]!);
  }
  // k is a close estimate; start one early and step forward to be exact.
  k = Math.max(0, k - 1);
  while (occurrence(start, frequency, k) < date) k++;
  return occurrence(start, frequency, k);
}

// The schedule's first date strictly after `date`.
export function nextAfter(start: string, frequency: Frequency, date: string) {
  return firstOnOrAfter(start, frequency, addDays(date, 1));
}

// Roughly what an amount on this schedule comes to per month, in cents.
export function monthlyCents(cents: number, frequency: Frequency) {
  const perYear = { weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, yearly: 1 }[frequency];
  return Math.round((cents * perYear) / 12);
}
