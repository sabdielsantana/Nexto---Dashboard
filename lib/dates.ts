import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { es } from "date-fns/locale";

/** Granularidad de los filtros de periodo en toda la app. */
export type PeriodKey = "dia" | "semana" | "mes" | "anio";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  dia: "Día",
  semana: "Semana",
  mes: "Mes",
  anio: "Año",
};

export const PERIOD_KEYS: readonly PeriodKey[] = ["dia", "semana", "mes", "anio"];

/** Bucket temporal que aceptan las funciones RPC (date_trunc). */
export type BucketKey = "day" | "week" | "month" | "year";

export interface DateRange {
  /** Inicio inclusivo, formato `yyyy-MM-dd`. */
  start: string;
  /** Fin inclusivo, formato `yyyy-MM-dd`. */
  end: string;
}

/** La semana empieza el lunes (convención local). */
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

/** Serializa a la representación `date` de Postgres, sin componente de zona. */
export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Parsea una `date` de Postgres como fecha local.
 * `new Date("2026-01-05")` la interpretaría como UTC y en zonas negativas
 * mostraría el día anterior; `parseISO` sobre la fecha suelta evita eso.
 */
export function fromDateKey(key: string): Date {
  return parseISO(key);
}

/** Rango [inicio, fin] del periodo que contiene a `reference`. */
export function rangeForPeriod(period: PeriodKey, reference: Date): DateRange {
  switch (period) {
    case "dia":
      return { start: toDateKey(reference), end: toDateKey(reference) };
    case "semana":
      return {
        start: toDateKey(startOfWeek(reference, WEEK_OPTIONS)),
        end: toDateKey(endOfWeek(reference, WEEK_OPTIONS)),
      };
    case "mes":
      return {
        start: toDateKey(startOfMonth(reference)),
        end: toDateKey(endOfMonth(reference)),
      };
    case "anio":
      return {
        start: toDateKey(startOfYear(reference)),
        end: toDateKey(endOfYear(reference)),
      };
  }
}

/** Mismo periodo, desplazado un ciclo hacia atrás (para la variación %). */
export function previousRangeForPeriod(
  period: PeriodKey,
  reference: Date,
): DateRange {
  switch (period) {
    case "dia":
      return rangeForPeriod(period, subDays(reference, 1));
    case "semana":
      return rangeForPeriod(period, subWeeks(reference, 1));
    case "mes":
      return rangeForPeriod(period, subMonths(reference, 1));
    case "anio":
      return rangeForPeriod(period, subYears(reference, 1));
  }
}

/** Bucket de agregación adecuado para graficar un periodo dado. */
export function bucketForPeriod(period: PeriodKey): BucketKey {
  switch (period) {
    case "dia":
      return "day";
    case "semana":
      return "day";
    case "mes":
      return "day";
    case "anio":
      return "month";
  }
}

/** Rango del mes visible en el calendario, alineado a semanas completas. */
export function calendarGridRange(month: Date): DateRange {
  return {
    start: toDateKey(startOfWeek(startOfMonth(month), WEEK_OPTIONS)),
    end: toDateKey(endOfWeek(endOfMonth(month), WEEK_OPTIONS)),
  };
}

/** Días de la grilla del calendario (semanas completas de lunes a domingo). */
export function calendarDays(month: Date): Date[] {
  const first = startOfWeek(startOfMonth(month), WEEK_OPTIONS);
  const last = endOfWeek(endOfMonth(month), WEEK_OPTIONS);
  const total = differenceInCalendarDays(last, first) + 1;
  return Array.from({ length: total }, (_, i) => addDays(first, i));
}

export function formatDateLong(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatDateShort(date: Date): string {
  return format(date, "d MMM yyyy", { locale: es });
}

/** Sin año — para tablas dentro de contenedores estrechos. */
export function formatDateCompact(date: Date): string {
  return format(date, "d MMM", { locale: es });
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy", { locale: es });
}

/** Etiqueta legible de un bucket devuelto por RPC. */
export function formatBucket(key: string, bucket: BucketKey): string {
  const date = fromDateKey(key);
  switch (bucket) {
    case "day":
      return format(date, "d MMM", { locale: es });
    case "week":
      return `sem. ${format(date, "d MMM", { locale: es })}`;
    case "month":
      return format(date, "MMM yyyy", { locale: es });
    case "year":
      return format(date, "yyyy");
  }
}

export function formatRange(range: DateRange): string {
  const start = fromDateKey(range.start);
  const end = fromDateKey(range.end);
  if (range.start === range.end) return formatDateLong(start);
  return `${formatDateShort(start)} — ${formatDateShort(end)}`;
}

export { WEEK_OPTIONS };
