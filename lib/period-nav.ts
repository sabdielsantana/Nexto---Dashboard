import { addDays, addMonths, addWeeks, addYears } from "date-fns";

import type { PeriodKey } from "@/lib/dates";

/** Desplaza la fecha de referencia `amount` periodos (negativo = atrás). */
export function shiftPeriod(
  period: PeriodKey,
  reference: Date,
  amount: number,
): Date {
  switch (period) {
    case "dia":
      return addDays(reference, amount);
    case "semana":
      return addWeeks(reference, amount);
    case "mes":
      return addMonths(reference, amount);
    case "anio":
      return addYears(reference, amount);
  }
}
