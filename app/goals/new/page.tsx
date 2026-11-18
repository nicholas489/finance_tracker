import type { Metadata } from "next";
import { saveGoal } from "@/app/actions/goals";
import { requireUser } from "@/lib/dal";
import { today } from "@/lib/format";
import { addDays } from "@/lib/schedule";
import { GoalForm } from "../goal-form";

export const metadata: Metadata = { title: "Add goal · Finance Tracker" };

export default async function NewGoalPage() {
  await requireUser();
  const tomorrow = addDays(today(), 1);

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm sm:p-8 dark:border-white/[.145] dark:bg-zinc-950">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Add savings goal</h1>
      <GoalForm
        action={saveGoal.bind(null, null)}
        initial={{ name: "", target: "", saved: "", deadline: "", notes: "" }}
        minDeadline={tomorrow}
        submitLabel="Add goal"
      />
    </div>
  );
}
