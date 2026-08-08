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
import { ZERO, formatMoney, formatSigned, toMoney, toNumber } from "@/lib/money";
import type { BalancePoint } from "@/lib/queries/analytics";
import { cn } from "@/lib/utils";

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

  const stats = useMemo(() => {
    const saldos = data.map((p) => toMoney(p.saldo));
    const inicial = saldos[0] ?? ZERO;
    const ultimo = saldos[saldos.length - 1] ?? ZERO;
    let maximo = inicial;
    for (const s of saldos) if (s > maximo) maximo = s;
    return { inicial, final: ultimo, variacion: ultimo - inicial, maximo };
  }, [data]);

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
    <div className="@container space-y-4">
      {/* Altura fluida con tope, igual criterio que el resto de gráficos. */}
      <div className="h-64 @2xl:h-72 @4xl:h-80">
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

      {/*
        En tarjetas anchas el hueco se llena con los extremos del periodo en
        vez de estirar la línea: saber de dónde a dónde fue el saldo vale más
        que un trazo más largo.
      */}
      <dl className="hidden gap-4 border-t border-border pt-3 @2xl:grid @2xl:grid-cols-4">
        <Extremo label="Saldo inicial" value={formatMoney(stats.inicial, currency)} />
        <Extremo label="Saldo final" value={formatMoney(stats.final, currency)} />
        <Extremo
          label="Variación"
          value={formatSigned(stats.variacion, currency)}
          tone={stats.variacion < 0n ? "negative" : "positive"}
        />
        <Extremo label="Máximo" value={formatMoney(stats.maximo, currency)} />
      </dl>
    </div>
  );
}

function Extremo({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "tabular text-sm font-semibold",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
