import type { Metadata } from "next";
import Link from "next/link";
import { cardClass, emptyStateClass, primaryButtonClass } from "@/app/button-classes";
import { Total } from "@/app/total";
import { requireUser } from "@/lib/dal";
import { today as getToday } from "@/lib/format";
import { goalProgress } from "@/lib/goal-form";
import { listGoals, type Goal } from "@/lib/goals";
import { GoalRow } from "./goal-row";

export const metadata: Metadata = { title: "Goals · Finance Tracker" };

export default async function GoalsPage() {
  const user = await requireUser();
  const today = getToday();
  const goals = await listGoals(user.id);

  const active: Goal[] = [];
  const done: Goal[] = [];
  let savedCents = 0;
  let targetCents = 0;
  for (const goal of goals) {
    const progress = goalProgress(goal, today);
    const finished = progress.status === "reached" || progress.status === "missed";
    (finished ? done : active).push(goal);
    if (!finished) {
      savedCents += progress.savedCents;
      targetCents += progress.targetCents;
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Savings goals</h1>
        <Link href="/goals/new" className={primaryButtonClass}>
          Add goal
        </Link>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Set an amount to save and a date to save it by, then add money as you put it aside to see
        whether you&apos;re on track.
      </p>

      {active.length > 0 && (
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Total label="Saved" cents={savedCents} />
          <Total label="Target" cents={targetCents} />
          <Total label="Left to save" cents={Math.max(0, targetCents - savedCents)} />
        </dl>
      )}

      {goals.length === 0 ? (
        <p className={`mt-6 ${emptyStateClass}`}>
          No savings goals yet. Add one for an emergency fund, a trip or anything else you&apos;re
          saving up for.
        </p>
      ) : (
        <>
          <GoalSection title="In progress" goals={active} today={today} />
          <GoalSection title="Finished" goals={done} today={today} />
        </>
      )}
    </>
  );
}

function GoalSection({ title, goals, today }: { title: string; goals: Goal[]; today: string }) {
  if (goals.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{title}</h2>
      <ul className={`divide-y divide-black/[.08] dark:divide-white/[.145] ${cardClass}`}>
        {goals.map((goal) => (
          <GoalRow key={goal.id} goal={goal} today={today} />
        ))}
      </ul>
    </section>
  );
}
