import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveGoal } from "@/app/actions/goals";
import { requireUser } from "@/lib/dal";
import { today } from "@/lib/format";
import { getGoal } from "@/lib/goals";
import { addDays } from "@/lib/schedule";
import { GoalForm } from "../../goal-form";

export const metadata: Metadata = { title: "Edit goal · Finance Tracker" };

export default async function EditGoalPage(props: PageProps<"/goals/[id]/edit">) {
  const user = await requireUser();
  const id = Number((await props.params).id);
  // Someone else's goal looks the same as a missing one.
  const goal = Number.isSafeInteger(id) ? await getGoal(user.id, id) : null;
  if (!goal) notFound();
  const tomorrow = addDays(today(), 1);

  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm sm:p-8 dark:border-white/[.145] dark:bg-zinc-950">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit savings goal</h1>
      <GoalForm
        action={saveGoal.bind(null, goal.id)}
        initial={{
          name: goal.name,
          target: goal.target,
          saved: goal.saved,
          deadline: goal.deadline,
          notes: goal.notes ?? "",
        }}
        // A deadline that has already passed can be kept, so don't block it.
        minDeadline={goal.deadline < tomorrow ? undefined : tomorrow}
        submitLabel="Save changes"
      />
    </div>
  );
}
