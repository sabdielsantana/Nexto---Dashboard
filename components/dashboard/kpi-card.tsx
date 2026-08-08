"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  type Money,
  formatMoney,
  formatPercent,
  percentChange,
  subtract,
  toMoney,
} from "@/lib/money";
import type { PeriodTotals } from "@/lib/queries/analytics";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: Money;
  /** Valor del periodo anterior, para la variación %. */
  previous?: Money;
  icon?: LucideIcon;
  /**
   * Cómo interpretar una subida. En gastos, subir es malo, así que la flecha
   * arriba se pinta en rojo.
   */
  goodDirection?: "up" | "down";
  currency?: string;
  tone?: "positive" | "negative" | "neutral";
}

export function KpiCard({
  label,
  value,
  previous,
  icon: Icon,
  goodDirection = "up",
  currency = "DOP",
  tone = "neutral",
}: KpiCardProps) {
  const change =
    previous !== undefined ? percentChange(value, previous) : null;

  const isGood =
    change === null || change === 0
      ? null
      : goodDirection === "up"
        ? change > 0
        : change < 0;

  return (
    <Card className="@container">
      <CardContent className="space-y-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
        </div>

        <p
          className={cn(
            "tabular text-xl font-bold lg:text-2xl",
            tone === "positive" && "text-positive",
            tone === "negative" && "text-negative",
          )}
        >
          {formatMoney(value, currency)}
        </p>

        {change !== null ? (
          <p
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isGood === null && "text-muted-foreground",
              isGood === true && "text-positive",
              isGood === false && "text-negative",
            )}
          >
            {change === 0 ? (
              <Minus className="h-3 w-3" />
            ) : change > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {formatPercent(change)}
            <span className="font-normal text-muted-foreground">
              vs. periodo anterior
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Sin datos del periodo anterior
          </p>
        )}

        {/*
          En tarjetas anchas se añade el valor absoluto del periodo anterior.
          Antes el ancho sobrante quedaba vacío a la derecha del número; ahora
          lo ocupa un dato en vez de estirar la tipografía.
        */}
        {previous !== undefined ? (
          <p className="hidden border-t border-border pt-1.5 text-xs text-muted-foreground @[16rem]:block">
            Periodo anterior:{" "}
            <span className="tabular font-medium text-foreground">
              {formatMoney(previous, currency)}
            </span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Trío de KPIs: ingresos, gastos y balance del periodo. */
export function KpiGrid({
  totals,
  previousTotals,
  currency = "DOP",
}: {
  totals: PeriodTotals;
  previousTotals: PeriodTotals;
  currency?: string;
}) {
  const ingresos = toMoney(totals.ingresos);
  const gastos = toMoney(totals.gastos);
  const balance = subtract(ingresos, gastos);

  const prevIngresos = toMoney(previousTotals.ingresos);
  const prevGastos = toMoney(previousTotals.gastos);
  const prevBalance = subtract(prevIngresos, prevGastos);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <KpiCard
        label="Ingresos"
        value={ingresos}
        previous={prevIngresos}
        goodDirection="up"
        tone="positive"
        currency={currency}
      />
      <KpiCard
        label="Gastos"
        value={gastos}
        previous={prevGastos}
        goodDirection="down"
        tone="negative"
        currency={currency}
      />
      <KpiCard
        label="Balance del periodo"
        value={balance}
        previous={prevBalance}
        goodDirection="up"
        tone={balance < 0n ? "negative" : "positive"}
        currency={currency}
      />
    </div>
  );
}
