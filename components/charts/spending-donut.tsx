"use client";

import { useMemo } from "react";

import { PieChart as PieIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { TOOLTIP_STYLE } from "@/components/charts/chart-theme";
import { EmptyState } from "@/components/ui/empty-state";
import { paletteColor } from "@/lib/constants";
import { ZERO, formatMoney, percentOf, toMoney, toNumber } from "@/lib/money";
import type { CategorySpending } from "@/lib/queries/analytics";

/** Categorías mostradas antes de agrupar el resto en "Otras". */
const MAX_SLICES = 8;

interface SpendingDonutProps {
  data: CategorySpending[];
  currency?: string;
}

export function SpendingDonut({ data, currency = "DOP" }: SpendingDonutProps) {
  const { slices, total } = useMemo(() => {
    let sum = ZERO;
    for (const entry of data) sum += toMoney(entry.total);

    const sorted = [...data].sort(
      (a, b) => Number(toMoney(b.total) - toMoney(a.total)),
    );

    const head = sorted.slice(0, MAX_SLICES);
    const tail = sorted.slice(MAX_SLICES);

    const result = head.map((entry, index) => ({
      name: `${entry.emoji ? `${entry.emoji} ` : ""}${entry.name}`,
      amount: toMoney(entry.total),
      value: toNumber(toMoney(entry.total)),
      color: entry.color ?? paletteColor(index),
    }));

    if (tail.length > 0) {
      const rest = tail.reduce((acc, entry) => acc + toMoney(entry.total), ZERO);
      result.push({
        name: `Otras (${tail.length})`,
        amount: rest,
        value: toNumber(rest),
        color: paletteColor(MAX_SLICES),
      });
    }

    return { slices: result, total: sum };
  }, [data]);

  if (slices.length === 0 || total === ZERO) {
    return (
      <EmptyState
        icon={PieIcon}
        title="Sin gastos en el periodo"
        description="Registra gastos para ver cómo se reparten entre tus categorías."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value: number) => [
                new Intl.NumberFormat("es-DO", {
                  style: "currency",
                  currency,
                  minimumFractionDigits: 2,
                }).format(value),
                "Gasto",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Total al centro de la dona */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="tabular text-lg font-bold">
            {formatMoney(total, currency)}
          </span>
        </div>
      </div>

      <ul className="space-y-1.5">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate">{slice.name}</span>
            <span className="tabular text-muted-foreground">
              {percentOf(slice.amount, total).toFixed(1)}%
            </span>
            <span className="tabular w-28 text-right font-medium">
              {formatMoney(slice.amount, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
