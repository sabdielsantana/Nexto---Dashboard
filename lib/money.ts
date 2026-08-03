/**
 * Aritmética monetaria de precisión.
 *
 * Regla del proyecto: nunca usar float/double para dinero. Toda cantidad se
 * maneja internamente como *centavos* en `bigint`, y solo se convierte a
 * `number` en el último paso (renderizado o alimentar un gráfico).
 *
 * La DB guarda `numeric(14,2)`. PostgREST lo serializa como número JSON; el
 * rango de numeric(14,2) en centavos (máx 1e14) cabe exacto en un double, así
 * que `Math.round(n * 100)` recupera los centavos sin pérdida. Aun así, en
 * cuanto el valor entra a la app se convierte a `bigint` y ahí se queda.
 */

/** Cantidad monetaria representada en centavos. */
export type Money = bigint;

export const ZERO: Money = 0n;

const CENTS_PER_UNIT = 100n;

/**
 * Convierte un valor crudo de la DB (o de un input) a centavos.
 * Acepta `number`, `string` o `null`/`undefined` (que devuelven 0).
 */
export function toMoney(value: string | number | null | undefined): Money {
  if (value === null || value === undefined || value === "") return ZERO;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return ZERO;
    return BigInt(Math.round(value * 100));
  }

  return parseMoneyString(value);
}

/**
 * Parsea una cadena decimal a centavos sin pasar por float.
 * Tolera separador de miles con coma, signo y hasta 2 decimales (redondea
 * medio arriba a partir del tercer decimal).
 */
export function parseMoneyString(input: string): Money {
  const cleaned = input.trim().replace(/[\s,]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "+") return ZERO;

  const match = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(cleaned);
  if (!match) return ZERO;

  const sign = match[1] === "-" ? -1n : 1n;
  const whole = match[2] === "" ? "0" : (match[2] ?? "0");
  const fractionRaw = match[3] ?? "";

  const cents = fractionRaw.slice(0, 2).padEnd(2, "0");
  let result = BigInt(whole) * CENTS_PER_UNIT + BigInt(cents);

  // Redondeo medio-arriba usando el tercer decimal.
  const thirdDecimal = fractionRaw[2];
  if (thirdDecimal !== undefined && Number(thirdDecimal) >= 5) {
    result += 1n;
  }

  return sign * result;
}

/** Serializa a la cadena decimal que espera Postgres para `numeric(14,2)`. */
export function toDbString(value: Money): string {
  const negative = value < ZERO;
  const abs = negative ? -value : value;
  const whole = abs / CENTS_PER_UNIT;
  const cents = abs % CENTS_PER_UNIT;
  return `${negative ? "-" : ""}${whole}.${cents.toString().padStart(2, "0")}`;
}

/**
 * Normaliza un monto crudo de la DB a cadena decimal canónica ("1234.50").
 *
 * Es la forma en que los montos cruzan la frontera Server → Client Component:
 * `bigint` no es serializable en el payload RSC y `number` reintroduciría el
 * float que el proyecto prohíbe. La cadena conserva los 2 decimales exactos y
 * el cliente la reconstruye con `toMoney()`.
 */
export function normalizeMoney(
  value: string | number | null | undefined,
): string {
  return toDbString(toMoney(value));
}

/**
 * Convierte a `number` para consumo de librerías de gráficos.
 * Solo para presentación — nunca para acumular ni comparar.
 */
export function toNumber(value: Money): number {
  return Number(value) / 100;
}

export function add(a: Money, b: Money): Money {
  return a + b;
}

export function subtract(a: Money, b: Money): Money {
  return a - b;
}

export function sum(values: readonly Money[]): Money {
  return values.reduce<Money>((acc, v) => acc + v, ZERO);
}

export function negate(value: Money): Money {
  return -value;
}

export function abs(value: Money): Money {
  return value < ZERO ? -value : value;
}

export function isZero(value: Money): boolean {
  return value === ZERO;
}

/** Multiplica por un escalar (p.ej. una tasa) redondeando a centavo. */
export function multiplyByRate(value: Money, rate: number): Money {
  if (!Number.isFinite(rate)) return ZERO;
  // Se escala la tasa a entero para no arrastrar el error del double.
  const SCALE = 1_000_000_000n;
  const scaledRate = BigInt(Math.round(rate * 1_000_000_000));
  const product = value * scaledRate;
  return roundedDivide(product, SCALE);
}

/** División con redondeo medio-arriba (hacia +∞ en empates positivos). */
export function roundedDivide(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) return ZERO;
  const negative = numerator < 0n !== denominator < 0n;
  const absNum = numerator < 0n ? -numerator : numerator;
  const absDen = denominator < 0n ? -denominator : denominator;
  const quotient = absNum / absDen;
  const remainder = absNum % absDen;
  const rounded = remainder * 2n >= absDen ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

/**
 * Porcentaje `value / total` como número (0-100+) para barras de progreso.
 * Devuelve 0 si el total es 0.
 */
export function percentOf(value: Money, total: Money): number {
  if (total === ZERO) return 0;
  // Se calcula con 4 decimales de precisión en enteros antes de bajar a number.
  const scaled = roundedDivide(value * 1_000_000n, total);
  return Number(scaled) / 10_000;
}

/** Variación porcentual entre dos periodos. `null` si la base es 0. */
export function percentChange(current: Money, previous: Money): number | null {
  if (previous === ZERO) return null;
  const delta = current - previous;
  const scaled = roundedDivide(delta * 1_000_000n, abs(previous));
  return Number(scaled) / 10_000;
}

const CURRENCY_LOCALE = "es-DO";

/** Formatea con símbolo de moneda. `currency` es el ISO de la cuenta. */
export function formatMoney(value: Money, currency = "DOP"): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

/** Formatea sin símbolo (para celdas de tabla densas). */
export function formatAmount(value: Money): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

/** Formato compacto para ejes de gráficos: 1.2K, 3.4M. */
export function formatCompact(value: Money, currency = "DOP"): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

/** Formatea con signo explícito — para deltas y balances netos. */
export function formatSigned(value: Money, currency = "DOP"): string {
  const formatted = formatMoney(abs(value), currency);
  if (value > ZERO) return `+${formatted}`;
  if (value < ZERO) return `−${formatted}`;
  return formatted;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}%`;
}
