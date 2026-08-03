"use client";

import Link from "next/link";

import { AlertTriangle, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney, percentOf, subtract, toMoney } from "@/lib/money";
import type { BudgetUsage } from "@/lib/queries/analytics";
import { cn } from "@/lib/utils";

const WARNING_THRESHOLD = 80;

/**
 * Solo aparece cuando hay presupuestos en riesgo o excedidos: en el dashboard
 * interesa lo que requiere atención, no la lista completa.
 */
export function BudgetAlerts({
  usage,
  periodLabel,
}: {
  usage: BudgetUsage[];
  periodLabel: string;
}) {
  const alerts = usage
    .map((entry) => {
      const limit = toMoney(entry.limitAmount);
      const spent = toMoney(entry.gastado);
      return {
        entry,
        limit,
        spent,
        percent: percentOf(spent, limit),
        exceeded: spent > limit,
      };
    })
    .filter((item) => item.percent >= WARNING_THRESHOLD)
    .sort((a, b) => b.percent - a.percent);

  if (alerts.length === 0) return null;

  return (
    <Card className="border-warning/40">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Presupuestos en alerta
          <span className="text-xs font-normal text-muted-foreground">
            ({periodLabel})
          </span>
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/presupuestos">
            Ver todos
            <ArrowRight />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {alerts.map(({ entry, limit, spent, percent, exceeded }) => (
            <li key={entry.budgetId} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{entry.emoji ?? "•"}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {entry.categoryName}
                </span>
                <Badge variant={exceeded ? "fallido" : "pendiente"}>
                  {exceeded
                    ? `Excedido por ${formatMoney(subtract(spent, limit))}`
                    : `Quedan ${formatMoney(subtract(limit, spent))}`}
                </Badge>
              </div>

              <Progress
                value={Math.min(percent, 100)}
                indicatorClassName={cn(
                  exceeded ? "bg-negative" : "bg-warning",
                )}
              />

              <p className="tabular text-xs text-muted-foreground">
                {formatMoney(spent)} de {formatMoney(limit)} ·{" "}
                {percent.toFixed(0)}%
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
