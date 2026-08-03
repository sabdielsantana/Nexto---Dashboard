import "server-only";

import { type DateRange, rangeForPeriod } from "@/lib/dates";
import { normalizeMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { BudgetPeriod } from "@/types/database";

export interface BudgetRow {
  id: string;
  categoryId: string;
  period: BudgetPeriod;
  limitAmount: string;
}

export async function getBudgets(): Promise<BudgetRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("budgets")
    .select("id, category_id, period, limit_amount");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    categoryId: row.category_id,
    period: row.period,
    limitAmount: normalizeMoney(row.limit_amount),
  }));
}

/** Ventana vigente de un periodo de presupuesto, relativa a `reference`. */
export function budgetWindow(
  period: BudgetPeriod,
  reference: Date,
): DateRange {
  switch (period) {
    case "semanal":
      return rangeForPeriod("semana", reference);
    case "mensual":
      return rangeForPeriod("mes", reference);
    case "anual":
      return rangeForPeriod("anio", reference);
  }
}
