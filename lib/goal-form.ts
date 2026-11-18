import { field } from "@/lib/form";
import { formatMoney, toCents } from "@/lib/format";
import { addDays, daysBetween } from "@/lib/schedule";
import { isValidDate, parseAmount } from "@/lib/transaction-form";

// What gets saved. Amounts are decimal strings like "1200.50"; deadline is "YYYY-MM-DD".
export type GoalInput = {
  name: string;
  target: string;
  saved: string;
  deadline: string;
  notes: string | null;
};

// The form's raw text, echoed back so it keeps what the user typed after an error.
export type GoalValues = Record<"name" | "target" | "saved" | "deadline" | "notes", string>;

export type GoalFormState =
  | {
      errors?: Partial<Record<keyof GoalValues, string[]>>;
      message?: string;
      values?: GoalValues;
    }
  | undefined;

const NAME_MAX = 100;
const NOTES_MAX = 500;
// How far ahead a deadline can be, so a typo like 20277 is caught.
const DEADLINE_MAX_YEARS = 50;
// The largest value numeric(12,2) holds.
export const SAVED_MAX = "9999999999.99";

// Like parseAmount, but blank or 0 is allowed and means nothing saved yet.
function parseSaved(raw: string): { amount: string } | { error: string } {
  const value = raw.trim().replace(/^\$/, "").replaceAll(",", "");
  if (value === "" || /^0+(\.0{1,2})?$/.test(value)) return { amount: "0" };
  const amount = parseAmount(value);
  return "error" in amount ? { error: "Enter how much you've saved so far, like 250.00, or leave it blank." } : amount;
}

// currentDeadline is the goal's deadline when editing: it may stay as it is
// even once it has passed, but a new deadline has to be in the future.
export function parseGoalForm(
  formData: FormData,
  today: string,
  currentDeadline?: string,
): { input: GoalInput } | { state: GoalFormState } {
  const values: GoalValues = {
    name: field(formData, "name").trim(),
    target: field(formData, "target").trim(),
    saved: field(formData, "saved").trim(),
    deadline: field(formData, "deadline"),
    notes: field(formData, "notes").trim(),
  };

  const errors: NonNullable<GoalFormState>["errors"] = {};
  if (!values.name) errors.name = ["Enter a name."];
  else if (values.name.length > NAME_MAX) errors.name = [`Name must be ${NAME_MAX} characters or fewer.`];

  const target = parseAmount(values.target);
  if ("error" in target) errors.target = [target.error];

  const saved = parseSaved(values.saved);
  if ("error" in saved) errors.saved = [saved.error];

  if (!isValidDate(values.deadline)) {
    errors.deadline = ["Enter a valid date."];
  } else if (values.deadline !== currentDeadline) {
    if (values.deadline <= today) errors.deadline = ["Choose a deadline after today."];
    else if (values.deadline > addDays(today, DEADLINE_MAX_YEARS * 366)) {
      errors.deadline = [`Choose a deadline within ${DEADLINE_MAX_YEARS} years.`];
    }
  }

  if (values.notes.length > NOTES_MAX) errors.notes = [`Notes must be ${NOTES_MAX} characters or fewer.`];

  if (Object.keys(errors).length || "error" in target || "error" in saved) return { state: { errors, values } };

  return {
    input: {
      name: values.name,
      target: target.amount,
      saved: saved.amount,
      deadline: values.deadline,
      notes: values.notes || null,
    },
  };
}

// reached: saved the whole target. missed: the deadline passed first.
// behind: saved less than an even pace from the start date would have by now.
export type GoalStatus = "reached" | "missed" | "behind" | "on-track";

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  reached: "Reached",
  missed: "Past deadline",
  behind: "Behind",
  "on-track": "On track",
};

const DAYS_PER_MONTH = 365.25 / 12;

export function goalProgress(
  goal: { saved: string; target: string; startDate: string; deadline: string },
  today: string,
) {
  const savedCents = toCents(goal.saved);
  const targetCents = toCents(goal.target);
  const leftCents = Math.max(0, targetCents - savedCents);
  // Share of the target saved, 0 to 1 (more if they've saved past it).
  const fraction = savedCents / targetCents;
  const daysLeft = daysBetween(today, goal.deadline);

  let status: GoalStatus;
  if (leftCents === 0) status = "reached";
  else if (daysLeft < 0) status = "missed";
  else {
    const totalDays = daysBetween(goal.startDate, goal.deadline);
    const elapsed = daysBetween(goal.startDate, today);
    const expected = totalDays > 0 ? Math.min(1, Math.max(0, elapsed / totalDays)) : 1;
    status = fraction >= expected ? "on-track" : "behind";
  }

  // What it takes to finish on time, spread evenly over the months left.
  const perMonthCents =
    status === "on-track" || status === "behind"
      ? Math.ceil(leftCents / Math.max(1, daysLeft / DAYS_PER_MONTH))
      : 0;

  return { savedCents, targetCents, leftCents, fraction, daysLeft, status, perMonthCents };
}

// One line on what's left to do: "Save about $250.00/month to reach it on time",
// "$40.00 to go in 12 days", "Deadline is today", or how it ended.
export function formatPace(progress: ReturnType<typeof goalProgress>) {
  const { status, leftCents, daysLeft, perMonthCents } = progress;
  if (status === "reached") return "You've saved the full amount.";
  if (status === "missed") return `${formatMoney(leftCents)} short of the target.`;
  if (daysLeft === 0) return `${formatMoney(leftCents)} to go, and the deadline is today.`;
  if (daysLeft < 31) return `${formatMoney(leftCents)} to go in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;
  return `Save about ${formatMoney(perMonthCents)}/month to reach it on time.`;
}
