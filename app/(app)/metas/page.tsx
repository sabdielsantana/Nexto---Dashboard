import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { GoalsView } from "@/components/goals/goals-view";
import { PageHeader } from "@/components/ui/page-header";
import { getGoals } from "@/lib/queries/goals";

export const metadata = { title: "Metas — Nexto" };

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <>
      <PageHeader
        title="Metas de ahorro"
        description="Progreso y proyección de si llegarás a tiempo según tu ritmo actual."
        action={goals.length > 0 ? <GoalFormDialog /> : undefined}
      />
      <GoalsView goals={goals} />
    </>
  );
}
