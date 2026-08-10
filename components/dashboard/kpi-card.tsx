"use client";

import Link from "next/link";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  type Money,
  percentChange,
  percentOf,
  subtract,
  toMoney,
  toNumber,
  ZERO,
} from "@/lib/money";
import type { PeriodTotals } from "@/lib/queries/analytics";
import { cn } from "@/lib/utils";

/** Partes ya separadas de un valor grande, para maquetarlas a distinto tamaño. */
interface ValueParts {
  /** Símbolo de moneda (RD$) o vacío. */
  symbol?: string;
  /** Parte entera, con separadores de miles. */
  integer: string;
  /** Punto decimal + decimales (".00"), o vacío. */
  fraction?: string;
  /** Sufijo pequeño, p.ej. "%". */
  suffix?: string;
}

/**
 * Descompone un monto en símbolo / entero / decimales usando el mismo
 * formateador que `formatMoney` (es-DO), para pintar cada parte a su tamaño.
 * `toNumber` es solo para presentación — no se acumula ni compara con él.
 */
function splitMoney(value: Money, currency: string): ValueParts {
  const parts = new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(toNumber(value));

  let symbol = "";
  let integer = "";
  let fraction = "";

  for (const part of parts) {
    switch (part.type) {
      case "currency":
        symbol += part.value;
        break;
      case "integer":
      case "group":
        integer += part.value;
        break;
      case "decimal":
      case "fraction":
        fraction += part.value;
        break;
      case "minusSign":
      case "plusSign":
        integer = part.value + integer;
        break;
      default:
        break;
    }
  }

  return { symbol, integer, fraction };
}

/**
 * El número protagonista de la tarjeta. `flex items-start` alinea arriba el
 * símbolo y los decimales respecto a la parte entera, que manda el tamaño.
 */
function KpiValue({ parts }: { parts: ValueParts }) {
  return (
    <p className="flex items-start leading-none tracking-[-0.03em] tabular-nums text-[clamp(2.5rem,4vw,3.5rem)] font-extrabold text-foreground">
      {parts.symbol ? (
        <span className="mr-1 text-[0.6em] font-bold text-muted-foreground">
          {parts.symbol}
        </span>
      ) : null}
      <span className="min-w-0 truncate">{parts.integer}</span>
      {parts.fraction ? (
        <span className="text-[0.5em] font-bold text-muted-foreground">
          {parts.fraction}
        </span>
      ) : null}
      {parts.suffix ? (
        <span className="ml-0.5 text-[0.55em] font-bold text-muted-foreground">
          {parts.suffix}
        </span>
      ) : null}
    </p>
  );
}

/**
 * Variación bajo el número: flecha + magnitud + "vs mes anterior".
 *
 * El color sigue la *dirección buena* del indicador, no el signo crudo: en
 * gastos, subir es malo, así que un +% se pinta en rojo. Sin dato previo se
 * muestra "— vs mes anterior" en muted, nunca un texto de error.
 */
function KpiDelta({
  change,
  goodDirection,
  unit,
}: {
  change: number | null;
  goodDirection: "up" | "down";
  unit: "%" | "pp";
}) {
  if (change === null) {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5" aria-hidden />
        <span>vs mes anterior</span>
      </p>
    );
  }

  const isGood =
    change === 0 ? null : goodDirection === "up" ? change > 0 : change < 0;

  const Arrow =
    change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;

  const magnitude =
    unit === "pp"
      ? `${Math.abs(change).toFixed(1)} pp`
      : `${Math.abs(change).toFixed(1)}%`;

  return (
    <p
      className={cn(
        "flex items-center gap-1 text-xs font-semibold",
        isGood === null && "text-muted-foreground",
        isGood === true && "text-positive-fg",
        isGood === false && "text-negative-fg",
      )}
    >
      <Arrow className="h-3.5 w-3.5" aria-hidden />
      {magnitude}
      <span className="font-normal text-muted-foreground">vs mes anterior</span>
    </p>
  );
}

/** Contenedor común de una tarjeta KPI, opcionalmente enlazada a su detalle. */
function KpiShell({
  label,
  icon: Icon,
  href,
  children,
}: {
  label: string;
  icon?: LucideIcon;
  href?: string;
  children: React.ReactNode;
}) {
  const card = (
    <Card
      className={cn(
        "@container h-full",
        href &&
          "transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} aria-label={`${label}: ver detalle`} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );
}

interface KpiCardProps {
  label: string;
  value: Money;
  previous?: Money;
  icon?: LucideIcon;
  goodDirection?: "up" | "down";
  currency?: string;
  href?: string;
}

/** Tarjeta KPI de un monto (ingresos, gastos, balance). */
export function KpiCard({
  label,
  value,
  previous,
  icon,
  goodDirection = "up",
  currency = "DOP",
  href,
}: KpiCardProps) {
  const change = previous !== undefined ? percentChange(value, previous) : null;

  return (
    <KpiShell label={label} icon={icon} href={href}>
      <div className="space-y-1.5">
        <KpiValue parts={splitMoney(value, currency)} />
        <KpiDelta change={change} goodDirection={goodDirection} unit="%" />
      </div>
    </KpiShell>
  );
}

/** Tarjeta KPI de la tasa de ahorro (un porcentaje, no un monto). */
function SavingsRateCard({
  rate,
  previousRate,
  icon,
  href,
}: {
  rate: number | null;
  previousRate: number | null;
  icon?: LucideIcon;
  href?: string;
}) {
  const parts: ValueParts =
    rate === null
      ? { integer: "—" }
      : (() => {
          const [int, frac] = rate.toFixed(1).split(".");
          return {
            integer: int ?? "0",
            fraction: `.${frac ?? "0"}`,
            suffix: "%",
          };
        })();

  // Variación en puntos porcentuales: diferencia directa de las dos tasas.
  const change =
    rate !== null && previousRate !== null ? rate - previousRate : null;

  return (
    <KpiShell label="Tasa de ahorro" icon={icon} href={href}>
      <div className="space-y-1.5">
        <KpiValue parts={parts} />
        <KpiDelta change={change} goodDirection="up" unit="pp" />
      </div>
    </KpiShell>
  );
}

/** Cuarteto de KPIs: ingresos, gastos, balance y tasa de ahorro del periodo. */
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

  // Tasa de ahorro = balance / ingresos. Sin ingresos no está definida.
  const savingsRate = ingresos === ZERO ? null : percentOf(balance, ingresos);
  const prevSavingsRate =
    prevIngresos === ZERO ? null : percentOf(prevBalance, prevIngresos);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard
        label="Ingresos"
        value={ingresos}
        previous={prevIngresos}
        goodDirection="up"
        currency={currency}
        href="/transacciones?tipo=ingreso"
      />
      <KpiCard
        label="Gastos"
        value={gastos}
        previous={prevGastos}
        goodDirection="down"
        currency={currency}
        href="/transacciones?tipo=gasto"
      />
      <KpiCard
        label="Balance del periodo"
        value={balance}
        previous={prevBalance}
        goodDirection="up"
        currency={currency}
        href="/transacciones"
      />
      <SavingsRateCard
        rate={savingsRate}
        previousRate={prevSavingsRate}
        href="/analitica"
      />
    </div>
  );
}
