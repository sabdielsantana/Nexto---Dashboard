"use client";

import { useMemo } from "react";

import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AXIS_PROPS,
  CHART_COLORS,
  TOOLTIP_STYLE,
} from "@/components/charts/chart-theme";
import { EmptyState } from "@/components/ui/empty-state";
import { type BucketKey, formatBucket } from "@/lib/dates";
import { toMoney, toNumber } from "@/lib/money";
import type { IncomeVsExpenseBucket } from "@/lib/queries/analytics";

interface IncomeExpenseBarsProps {
  data: IncomeVsExpenseBucket[];
  bucket: BucketKey;
  currency?: string;
}

export function IncomeExpenseBars({
  data,
  bucket,
  currency = "DOP",
}: IncomeExpenseBarsProps) {
  const rows = useMemo(
    () =>
      data.map((entry) => ({
        label: formatBucket(entry.bucket, bucket),
        ingresos: toNumber(toMoney(entry.ingresos)),
        gastos: toNumber(toMoney(entry.gastos)),
      })),
    [data, bucket],
  );

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sin movimientos en el periodo"
        description="Cuando registres ingresos o gastos aparecerán comparados aquí."
      />
    );
  }

  const currencyFormatter = new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.grid}
            vertical={false}
          />
          <XAxis dataKey="label" {...AXIS_PROPS} interval="preserveStartEnd" />
          <YAxis
            {...AXIS_PROPS}
            width={62}
            tickFormatter={(value: number) => currencyFormatter.format(value)}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
            formatter={(value: number, name: string) => [
              new Intl.NumberFormat("es-DO", {
                style: "currency",
                currency,
                minimumFractionDigits: 2,
              }).format(value),
              name === "ingresos" ? "Ingresos" : "Gastos",
            ]}
          />
          <Legend
            formatter={(value: string) =>
              value === "ingresos" ? "Ingresos" : "Gastos"
            }
            wrapperStyle={{ fontSize: "0.8rem" }}
          />
          <Bar
            dataKey="ingresos"
            fill={CHART_COLORS.positive}
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
          />
          <Bar
            dataKey="gastos"
            fill={CHART_COLORS.negative}
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
