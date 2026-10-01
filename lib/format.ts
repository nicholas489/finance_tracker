const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export function formatMoney(cents: number) {
  return money.format(cents / 100);
}

// "12.50" -> 1250. Adding up cents as integers avoids float drift in totals.
export function toCents(amount: string) {
  return Math.round(Number(amount) * 100);
}

const longDate = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

// "2026-10-01" -> "Oct 1, 2026". Read as UTC so the day never shifts.
export function formatDate(date: string) {
  return longDate.format(new Date(`${date}T00:00:00Z`));
}

// Today's date as "YYYY-MM-DD". The server runs in UTC, which is already
// tomorrow on a Toronto evening, so use the users' time zone instead.
export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
}
