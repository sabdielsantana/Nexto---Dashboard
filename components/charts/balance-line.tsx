"use client";

import { useMemo } from "react";

import { LineChart as LineIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
import type { BalancePoint } from "@/lib/queries/analytics";

interface BalanceLineProps {
  data: BalancePoint[];
  bucket: BucketKey;
  currency?: string;
}

export function BalanceLine({
  data,
  bucket,
  currency = "DOP",
}: BalanceLineProps) {
  const rows = useMemo(
    () =>
      data.map((point) => ({
        label: formatBucket(point.bucket, bucket),
        saldo: toNumber(toMoney(point.saldo)),
      })),
    [data, bucket],
  );

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={LineIcon}
        title="Sin datos de saldo"
        description="La evolución aparece cuando hay transacciones en el periodo."
      />
    );
  }

  const compact = new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={CHART_COLORS.info}
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor={CHART_COLORS.info}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.grid}
            vertical={false}
          />
          <XAxis dataKey="label" {...AXIS_PROPS} interval="preserveStartEnd" />
          <YAxis
            {...AXIS_PROPS}
            width={62}
            tickFormatter={(value: number) => compact.format(value)}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value: number) => [
              new Intl.NumberFormat("es-DO", {
                style: "currency",
                currency,
                minimumFractionDigits: 2,
              }).format(value),
              "Saldo",
            ]}
          />
          <Area
            type="monotone"
            dataKey="saldo"
            stroke={CHART_COLORS.info}
            strokeWidth={2}
            fill="url(#saldoFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
