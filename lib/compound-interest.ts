import {
  type Money,
  ZERO,
  multiplyByRate,
  roundedDivide,
} from "@/lib/money";

/** Veces que se capitaliza el interés en un año. */
export type CompoundFrequency =
  | "anual"
  | "semestral"
  | "trimestral"
  | "mensual"
  | "quincenal"
  | "diaria";

export const COMPOUND_PERIODS_PER_YEAR: Record<CompoundFrequency, number> = {
  anual: 1,
  semestral: 2,
  trimestral: 4,
  mensual: 12,
  quincenal: 24,
  diaria: 365,
};

export const COMPOUND_FREQUENCY_LABELS: Record<CompoundFrequency, string> = {
  anual: "Anual",
  semestral: "Semestral",
  trimestral: "Trimestral",
  mensual: "Mensual",
  quincenal: "Quincenal",
  diaria: "Diaria",
};

export const COMPOUND_FREQUENCIES: readonly CompoundFrequency[] = [
  "anual",
  "semestral",
  "trimestral",
  "mensual",
  "quincenal",
  "diaria",
];

/** Con qué periodicidad se hace el aporte. */
export type ContributionFrequency = "mensual" | "trimestral" | "anual";

export const CONTRIBUTION_PERIODS_PER_YEAR: Record<
  ContributionFrequency,
  number
> = {
  mensual: 12,
  trimestral: 4,
  anual: 1,
};

export const CONTRIBUTION_FREQUENCY_LABELS: Record<
  ContributionFrequency,
  string
> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  anual: "Anual",
};

export const CONTRIBUTION_FREQUENCIES: readonly ContributionFrequency[] = [
  "mensual",
  "trimestral",
  "anual",
];

export interface CompoundInterestInput {
  /** Capital inicial, en centavos. */
  principal: Money;
  /** Aporte periódico, en centavos. */
  contribution: Money;
  contributionFrequency: ContributionFrequency;
  compoundFrequency: CompoundFrequency;
  /** Plazo en años enteros. */
  years: number;
  /**
   * Tasa nominal anual en porcentaje (p.ej. 8.5 para 8.5%).
   * Si se pasa `variableRates`, se usa la tasa del año correspondiente y
   * `annualRate` queda como respaldo para los años no cubiertos.
   */
  annualRate: number;
  /** Tasa por año (índice 0 = primer año). Opcional. */
  variableRates?: readonly number[];
}

export interface CompoundYearRow {
  /** Año 1..n. */
  year: number;
  /** Tasa nominal anual aplicada ese año, en porcentaje. */
  rate: number;
  /** Saldo al inicio del año. */
  openingBalance: Money;
  /** Aportes hechos durante el año. */
  contributed: Money;
  /** Intereses generados durante el año. */
  interest: Money;
  /** Saldo al cierre del año. */
  closingBalance: Money;
  /** Total aportado acumulado, sin contar intereses. */
  totalContributed: Money;
  /** Intereses acumulados hasta ese año. */
  totalInterest: Money;
}

export interface CompoundInterestResult {
  rows: CompoundYearRow[];
  finalBalance: Money;
  /** Capital inicial + todos los aportes. */
  totalInvested: Money;
  totalInterest: Money;
}

/**
 * Proyección de interés compuesto con aportes periódicos.
 *
 * La simulación avanza periodo de capitalización a periodo de capitalización.
 * En cada uno se aplica la tasa periódica (nominal anual / periodos por año) y
 * se añaden los aportes que caen dentro de ese periodo. Todo el cálculo ocurre
 * en centavos (`bigint`); la tasa es el único `number` y se aplica con
 * `multiplyByRate`, que redondea a centavo en cada paso.
 *
 * Ese redondeo por periodo es intencional: replica cómo una cuenta real
 * acredita intereses (al centavo, cada periodo), no la fórmula continua. Por
 * eso el resultado puede diferir en algunos centavos de `P·(1+i)^n`. Ejemplo:
 * 1000 al 12% nominal con capitalización mensual durante 1 año da 1126.84
 * aquí, frente a 1126.8250 en matemática continua.
 */
export function calculateCompoundInterest(
  input: CompoundInterestInput,
): CompoundInterestResult {
  const years = Math.max(0, Math.floor(input.years));
  const periodsPerYear = COMPOUND_PERIODS_PER_YEAR[input.compoundFrequency];
  const contributionsPerYear =
    CONTRIBUTION_PERIODS_PER_YEAR[input.contributionFrequency];

  const rows: CompoundYearRow[] = [];

  let balance = input.principal;
  let totalContributed = ZERO;
  let totalInterest = ZERO;

  for (let year = 1; year <= years; year += 1) {
    const rate = rateForYear(input, year);
    const periodRate = rate / 100 / periodsPerYear;

    const openingBalance = balance;
    let yearContributed = ZERO;
    let yearInterest = ZERO;

    // Aportes del año repartidos entre los periodos de capitalización.
    // `pending` acumula los aportes aún no asignados para no perder ninguno
    // cuando las frecuencias no son múltiplos exactos.
    let contributionsMade = 0;

    for (let period = 1; period <= periodsPerYear; period += 1) {
      const interest = multiplyByRate(balance, periodRate);
      balance += interest;
      yearInterest += interest;

      // Cuántos aportes deberían haberse hecho al cerrar este periodo.
      const expected = Math.floor(
        (contributionsPerYear * period) / periodsPerYear,
      );
      const due = expected - contributionsMade;

      if (due > 0 && input.contribution !== ZERO) {
        const amount = input.contribution * BigInt(due);
        balance += amount;
        yearContributed += amount;
      }
      contributionsMade = expected;
    }

    totalContributed += yearContributed;
    totalInterest += yearInterest;

    rows.push({
      year,
      rate,
      openingBalance,
      contributed: yearContributed,
      interest: yearInterest,
      closingBalance: balance,
      totalContributed,
      totalInterest,
    });
  }

  return {
    rows,
    finalBalance: balance,
    totalInvested: input.principal + totalContributed,
    totalInterest,
  };
}

/** Tasa aplicable al año dado; cae a la tasa fija si no hay valor variable. */
function rateForYear(input: CompoundInterestInput, year: number): number {
  const variable = input.variableRates?.[year - 1];
  if (variable !== undefined && Number.isFinite(variable)) return variable;
  return input.annualRate;
}

/**
 * Tasa efectiva anual equivalente, en porcentaje.
 * Útil para comparar frecuencias de capitalización distintas.
 */
export function effectiveAnnualRate(
  nominalRate: number,
  frequency: CompoundFrequency,
): number {
  const periods = COMPOUND_PERIODS_PER_YEAR[frequency];
  return ((1 + nominalRate / 100 / periods) ** periods - 1) * 100;
}

/** Reparto porcentual entre capital aportado e intereses. */
export function contributionSplit(result: CompoundInterestResult): {
  investedPercent: number;
  interestPercent: number;
} {
  const total = result.finalBalance;
  if (total === ZERO) return { investedPercent: 0, interestPercent: 0 };

  const invested = Number(roundedDivide(result.totalInvested * 10_000n, total)) / 100;
  return {
    investedPercent: invested,
    interestPercent: Math.max(0, 100 - invested),
  };
}
