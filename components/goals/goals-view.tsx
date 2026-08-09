"use client";

import { useState, useTransition } from "react";

import { CalendarClock, Minus, Pencil, Plus, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { contributeToGoal, deleteGoal } from "@/app/(app)/metas/actions";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatDateShort, fromDateKey } from "@/lib/dates";
import { GOAL_STATUS_LABELS, type GoalStatus, projectGoal } from "@/lib/goals";
import { formatMoney, toMoney } from "@/lib/money";
import type { GoalRow } from "@/lib/queries/goals";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<GoalStatus, "exito" | "progreso" | "pendiente" | "fallido" | "expirado"> = {
  completada: "exito",
  en_ritmo: "progreso",
  atrasada: "pendiente",
  sin_ritmo: "expirado",
  vencida: "fallido",
};

const PROGRESS_COLOR: Record<GoalStatus, string> = {
  completada: "bg-positive",
  en_ritmo: "bg-info",
  atrasada: "bg-warning",
  sin_ritmo: "bg-muted-foreground",
  vencida: "bg-negative",
};

export function GoalsView({ goals }: { goals: GoalRow[] }) {
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="Aún no tienes metas de ahorro"
        description="Crea una meta y sigue su progreso con proyección de si llegarás a tiempo."
        action={<GoalFormDialog />}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </div>
  );
}

function GoalCard({ goal }: { goal: GoalRow }) {
  const target = toMoney(goal.targetAmount);
  const current = toMoney(goal.currentAmount);

  const projection = projectGoal({
    target,
    current,
    deadline: goal.deadline,
    createdAt: goal.createdAt,
  });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accentAlt/15 text-lg">
            {goal.emoji ?? "🎯"}
          </span>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{goal.name}</CardTitle>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              {formatDateShort(fromDateKey(goal.deadline))}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <GoalFormDialog
            goal={goal}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Editar meta">
                <Pencil />
              </Button>
            }
          />
          <ConfirmDelete
            title={`Eliminar "${goal.name}"`}
            description="Se perderá el registro de esta meta y su progreso."
            successMessage="Meta eliminada"
            onConfirm={() => deleteGoal(goal.id)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <p className="tabular text-xl font-bold">{formatMoney(current)}</p>
          <p className="tabular text-sm text-muted-foreground">
            de {formatMoney(target)}
          </p>
        </div>

        <Progress
          value={Math.min(projection.percent, 100)}
          indicatorClassName={PROGRESS_COLOR[projection.status]}
          aria-label={`${projection.percent.toFixed(0)}% completado`}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="tabular text-xs text-muted-foreground">
            {projection.percent.toFixed(0)}% completado
          </span>
          <Badge variant={STATUS_BADGE[projection.status]}>
            <TrendingUp />
            {GOAL_STATUS_LABELS[projection.status]}
          </Badge>
        </div>

        <ProjectionNote projection={projection} />

        <ContributeForm goalId={goal.id} />
      </CardContent>
    </Card>
  );
}

function ProjectionNote({
  projection,
}: {
  projection: ReturnType<typeof projectGoal>;
}) {
  const currency = "DOP";

  let message: string;
  switch (projection.status) {
    case "completada":
      message = "Meta alcanzada. 🎉";
      break;
    case "vencida":
      message = `La fecha límite pasó hace ${Math.abs(projection.daysLeft)} días y faltan ${formatMoney(projection.remaining, currency)}.`;
      break;
    case "sin_ritmo":
      message = projection.requiredPerDay
        ? `Necesitas ahorrar ${formatMoney(projection.requiredPerDay, currency)} al día durante ${projection.daysLeft} días.`
        : "Aún no hay ritmo de ahorro para proyectar.";
      break;
    case "en_ritmo":
      message = `A tu ritmo (${formatMoney(projection.pacePerDay ?? 0n, currency)}/día) la completas en ~${projection.daysAtCurrentPace} días, ${projection.daysLeft - (projection.daysAtCurrentPace ?? 0)} antes de la fecha límite.`;
      break;
    case "atrasada":
      message = `A tu ritmo actual tardarías ~${projection.daysAtCurrentPace} días, pero solo quedan ${projection.daysLeft}. Necesitas ${formatMoney(projection.requiredPerDay ?? 0n, currency)}/día.`;
      break;
  }

  return (
    <p
      className={cn(
        "rounded-md border px-2.5 py-2 text-xs",
        projection.status === "atrasada" && "border-warning/30 bg-warning/10 text-warning-fg",
        projection.status === "vencida" && "border-negative/30 bg-negative/10 text-negative-fg",
        projection.status === "en_ritmo" && "border-info/30 bg-info/10 text-info-fg",
        projection.status === "completada" && "border-positive/30 bg-positive/10 text-positive-fg",
        projection.status === "sin_ritmo" && "border-border bg-muted/40 text-muted-foreground",
      )}
      aria-live="polite"
    >
      {message}
    </p>
  );
}

/** Registra aportes o retiros sobre el ahorro acumulado de la meta. */
function ContributeForm({ goalId }: { goalId: string }) {
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(sign: 1 | -1) {
    if (amount.trim() === "") {
      toast.error("Indica un monto.");
      return;
    }

    startTransition(async () => {
      // Se normaliza el signo: el usuario podría haber escrito ya un "-".
      const magnitude = amount.trim().replace(/^[+-]/, "");
      const raw = sign === -1 ? `-${magnitude}` : magnitude;
      const result = await contributeToGoal(goalId, raw);
      if (result.ok) {
        toast.success(sign === 1 ? "Aporte registrado" : "Retiro registrado");
        setAmount("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5 border-t border-border pt-3">
      <Input
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        inputMode="decimal"
        placeholder="Aportar…"
        className="h-9 tabular"
        aria-label="Monto del aporte"
      />
      <Button
        type="button"
        size="icon-sm"
        variant="positive"
        onClick={() => submit(1)}
        disabled={pending}
        aria-label="Registrar aporte"
      >
        <Plus />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        onClick={() => submit(-1)}
        disabled={pending}
        aria-label="Registrar retiro"
      >
        <Minus />
      </Button>
    </div>
  );
}
