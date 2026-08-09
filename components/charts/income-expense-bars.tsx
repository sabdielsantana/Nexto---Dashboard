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
import { ZERO, formatMoney, roundedDivide, toMoney, toNumber } from "@/lib/money";
import type { IncomeVsExpenseBucket } from "@/lib/queries/analytics";
import { cn } from "@/lib/utils";

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

  // Se acumula en centavos y solo al final se formatea — nada de floats.
  const totales = useMemo(() => {
    let ingresos = ZERO;
    let gastos = ZERO;
    let conGasto = 0;

    for (const entry of data) {
      ingresos += toMoney(entry.ingresos);
      const g = toMoney(entry.gastos);
      gastos += g;
      if (g !== ZERO) conGasto += 1;
    }

    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
      mediaGasto: conGasto > 0 ? roundedDivide(gastos, BigInt(conGasto)) : ZERO,
    };
  }, [data]);

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
    <div className="@container space-y-4">
      {/*
       * Altura fluida con tope: crece un poco en tarjetas grandes pero no se
       * desmadra. El ancho sobrante no se gasta en engordar las barras
       * (maxBarSize las limita) sino en el resumen de abajo.
       */}
      <div className="h-64 @2xl:h-72 @4xl:h-80">
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
          {/*
            Recharts colorea la etiqueta con el color de la serie, y el verde
            de ingresos sobre tarjeta clara se queda en 2.9:1. Se devuelve un
            span con color de texto propio: la muestra conserva el color de la
            serie, el texto pasa a foreground.
          */}
          <Legend
            formatter={(value: string) => (
              <span className="text-foreground">
                {value === "ingresos" ? "Ingresos" : "Gastos"}
              </span>
            )}
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

      {/*
        El espacio sobrante se convierte en dato: totales del periodo, media
        diaria y el día de mayor gasto. Solo aparece cuando la tarjeta tiene
        ancho para ello, así en columnas estrechas no compite con el gráfico.
      */}
      <dl className="hidden gap-4 border-t border-border pt-3 @2xl:grid @2xl:grid-cols-4">
        <Resumen label="Ingresos" value={formatMoney(totales.ingresos, currency)} tone="positive" />
        <Resumen label="Gastos" value={formatMoney(totales.gastos, currency)} tone="negative" />
        <Resumen
          label="Balance"
          value={formatMoney(totales.balance, currency)}
          tone={totales.balance < 0n ? "negative" : "positive"}
        />
        <Resumen
          label="Media diaria de gasto"
          value={formatMoney(totales.mediaGasto, currency)}
          tone="muted"
        />
      </dl>
    </div>
  );
}

function Resumen({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "muted";
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "tabular text-sm font-semibold",
          tone === "positive" && "text-positive-fg",
          tone === "negative" && "text-negative-fg",
          tone === "muted" && "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
