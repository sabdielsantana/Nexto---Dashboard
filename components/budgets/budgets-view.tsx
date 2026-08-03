"use client";

import { AlertTriangle, CheckCircle2, Pencil, PiggyBank } from "lucide-react";

import { deleteBudget } from "@/app/(app)/presupuestos/actions";
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { BUDGET_PERIOD_LABELS } from "@/lib/constants";
import { formatMoney, percentOf, subtract, toMoney } from "@/lib/money";
import type { BudgetUsage } from "@/lib/queries/analytics";
import type { BudgetRow } from "@/lib/queries/budgets";
import type { CategoryOption } from "@/lib/queries/categories";
import { cn } from "@/lib/utils";
import type { BudgetPeriod } from "@/types/database";

/** Umbral a partir del cual se avisa que el presupuesto está por agotarse. */
const WARNING_THRESHOLD = 80;

export interface BudgetGroup {
  period: BudgetPeriod;
  /** Etiqueta de la ventana vigente, p.ej. "1 ene 2026 — 31 ene 2026". */
  windowLabel: string;
  usage: BudgetUsage[];
}

interface BudgetsViewProps {
  groups: BudgetGroup[];
  budgets: BudgetRow[];
  categories: CategoryOption[];
}

export function BudgetsView({ groups, budgets, categories }: BudgetsViewProps) {
  const total = groups.reduce((acc, group) => acc + group.usage.length, 0);

  if (total === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="Sin presupuestos definidos"
        description="Fija un límite de gasto por categoría y te avisamos cuando te acerques o lo superes."
        action={<BudgetFormDialog categories={categories} />}
      />
    );
  }

  const budgetById = new Map(budgets.map((budget) => [budget.id, budget]));

  return (
    <div className="space-y-6">
      {groups
        .filter((group) => group.usage.length > 0)
        .map((group) => (
          <section key={group.period} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {BUDGET_PERIOD_LABELS[group.period]}
              </h3>
              <span className="text-xs text-muted-foreground">
                {group.windowLabel}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.usage.map((usage) => (
                <BudgetCard
                  key={usage.budgetId}
                  usage={usage}
                  budget={budgetById.get(usage.budgetId)}
                  categories={categories}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

function BudgetCard({
  usage,
  budget,
  categories,
}: {
  usage: BudgetUsage;
  budget: BudgetRow | undefined;
  categories: CategoryOption[];
}) {
  const limit = toMoney(usage.limitAmount);
  const spent = toMoney(usage.gastado);
  const remaining = subtract(limit, spent);
  const percent = percentOf(spent, limit);

  const exceeded = spent > limit;
  const warning = !exceeded && percent >= WARNING_THRESHOLD;

  return (
    <Card
      className={cn(
        exceeded && "border-negative/50",
        warning && "border-warning/50",
      )}
    >
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base"
            style={{ backgroundColor: `${usage.color ?? "#64748b"}22` }}
          >
            {usage.emoji ?? "•"}
          </span>
          <CardTitle className="truncate text-base">
            {usage.categoryName}
          </CardTitle>
        </div>

        <div className="flex shrink-0 items-center">
          {budget ? (
            <BudgetFormDialog
              categories={categories}
              budget={budget}
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Editar presupuesto"
                >
                  <Pencil />
                </Button>
              }
            />
          ) : null}
          <ConfirmDelete
            title={`Eliminar presupuesto de "${usage.categoryName}"`}
            description="Dejarás de recibir alertas de esta categoría. Las transacciones no se ven afectadas."
            successMessage="Presupuesto eliminado"
            onConfirm={() => deleteBudget(usage.budgetId)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <p className="tabular text-xl font-bold">{formatMoney(spent)}</p>
          <p className="tabular text-sm text-muted-foreground">
            de {formatMoney(limit)}
          </p>
        </div>

        <Progress
          value={Math.min(percent, 100)}
          indicatorClassName={cn(
            exceeded ? "bg-negative" : warning ? "bg-warning" : "bg-positive",
          )}
          aria-label={`${percent.toFixed(0)}% consumido`}
        />

        <div className="flex items-center justify-between gap-2">
          <span className="tabular text-xs text-muted-foreground">
            {percent.toFixed(0)}% consumido
          </span>

          {exceeded ? (
            <Badge variant="fallido">
              <AlertTriangle />
              Excedido por {formatMoney(-remaining)}
            </Badge>
          ) : warning ? (
            <Badge variant="pendiente">
              <AlertTriangle />
              Quedan {formatMoney(remaining)}
            </Badge>
          ) : (
            <Badge variant="exito">
              <CheckCircle2 />
              Quedan {formatMoney(remaining)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
