import { type PeriodKey, PERIOD_KEYS, toDateKey } from "@/lib/dates";
import type { TransactionType } from "@/types/database";

export type SearchParams = Record<string, string | string[] | undefined>;

/** Toma el primer valor si el parámetro viene repetido. */
export function firstParam(
  params: SearchParams,
  key: string,
): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parsePeriod(
  params: SearchParams,
  fallback: PeriodKey = "mes",
): PeriodKey {
  const value = firstParam(params, "periodo");
  return PERIOD_KEYS.includes(value as PeriodKey)
    ? (value as PeriodKey)
    : fallback;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha de referencia del periodo; hoy si falta o es inválida. */
export function parseReferenceDate(
  params: SearchParams,
  key = "fecha",
): string {
  const value = firstParam(params, key);
  if (value && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))) {
    return value;
  }
  return toDateKey(new Date());
}

export function parseTransactionType(
  params: SearchParams,
): TransactionType | undefined {
  const value = firstParam(params, "tipo");
  return value === "ingreso" || value === "gasto" ? value : undefined;
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ignora valores que no sean UUID para no mandar basura a PostgREST. */
export function parseUuid(
  params: SearchParams,
  key: string,
): string | undefined {
  const value = firstParam(params, key);
  return value && UUID.test(value) ? value : undefined;
}
