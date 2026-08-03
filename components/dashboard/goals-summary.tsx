"use client";

import { Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { GOAL_STATUS_LABELS, projectGoal } from "@/lib/goals";
import { formatMoney, toMoney } from "@/lib/money";
import type { GoalRow } from "@/lib/queries/goals";

const BADGE_BY_STATUS = {
  completada: "exito",
  en_ritmo: "progreso",
  atrasada: "pendiente",
  sin_ritmo: "expirado",
  vencida: "fallido",
} as const;

const BAR_BY_STATUS = {
  completada: "bg-positive",
  en_ritmo: "bg-info",
  atrasada: "bg-warning",
  sin_ritmo: "bg-muted-foreground",
  vencida: "bg-negative",
} as const;

/** Las metas más próximas a vencer, con su progreso. */
export function GoalsSummary({ goals }: { goals: GoalRow[] }) {
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="Sin metas activas"
        description="Define una meta de ahorro para seguir su progreso."
        className="py-8"
      />
    );
  }

  return (
    <ul className="space-y-4">
      {goals.slice(0, 3).map((goal) => {
        const projection = projectGoal({
          target: toMoney(goal.targetAmount),
          current: toMoney(goal.currentAmount),
          deadline: goal.deadline,
          createdAt: goal.createdAt,
        });

        return (
          <li key={goal.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{goal.emoji ?? "🎯"}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {goal.name}
              </span>
              <Badge variant={BADGE_BY_STATUS[projection.status]}>
                {GOAL_STATUS_LABELS[projection.status]}
              </Badge>
            </div>

            <Progress
              value={Math.min(projection.percent, 100)}
              indicatorClassName={BAR_BY_STATUS[projection.status]}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="tabular">
                {formatMoney(toMoney(goal.currentAmount))} de{" "}
                {formatMoney(toMoney(goal.targetAmount))}
              </span>
              <span className="tabular">{projection.percent.toFixed(0)}%</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
