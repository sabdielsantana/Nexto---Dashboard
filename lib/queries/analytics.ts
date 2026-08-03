import "server-only";

import type { BucketKey, DateRange } from "@/lib/dates";
import { normalizeMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { BudgetPeriod } from "@/types/database";

/**
 * Todas las agregaciones se resuelven en Postgres mediante las funciones de
 * `0002_analytics_rpc.sql`. Nunca se traen las transacciones crudas para
 * sumarlas en el cliente.
 */

export interface DailyBalance {
  day: string;
  ingresos: string;
  gastos: string;
  neto: string;
}

/** Balance neto por día — alimenta el heatmap del calendario. */
export async function getDailyNetBalance(
  range: DateRange,
): Promise<DailyBalance[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("daily_net_balance", {
    p_start: range.start,
    p_end: range.end,
  });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    day: row.day,
    ingresos: normalizeMoney(row.ingresos),
    gastos: normalizeMoney(row.gastos),
    neto: normalizeMoney(row.neto),
  }));
}

export interface PeriodTotals {
  ingresos: string;
  gastos: string;
}

export async function getPeriodTotals(range: DateRange): Promise<PeriodTotals> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("period_totals", {
    p_start: range.start,
    p_end: range.end,
  });

  if (error) throw error;

  const row = data?.[0];
  return {
    ingresos: normalizeMoney(row?.ingresos),
    gastos: normalizeMoney(row?.gastos),
  };
}

export interface CategorySpending {
  categoryId: string | null;
  name: string;
  emoji: string | null;
  color: string | null;
  total: string;
}

export async function getSpendingByCategory(
  range: DateRange,
): Promise<CategorySpending[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("spending_by_category", {
    p_start: range.start,
    p_end: range.end,
  });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    categoryId: row.category_id,
    name: row.category_name,
    emoji: row.emoji,
    color: row.color,
    total: normalizeMoney(row.total),
  }));
}

export interface IncomeVsExpenseBucket {
  bucket: string;
  ingresos: string;
  gastos: string;
}

export async function getIncomeVsExpense(
  range: DateRange,
  bucket: BucketKey,
): Promise<IncomeVsExpenseBucket[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("income_vs_expense", {
    p_start: range.start,
    p_end: range.end,
    p_bucket: bucket,
  });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    bucket: row.bucket,
    ingresos: normalizeMoney(row.ingresos),
    gastos: normalizeMoney(row.gastos),
  }));
}

export interface BalancePoint {
  bucket: string;
  saldo: string;
}

export async function getBalanceEvolution(
  range: DateRange,
  bucket: BucketKey,
): Promise<BalancePoint[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("balance_evolution", {
    p_start: range.start,
    p_end: range.end,
    p_bucket: bucket,
  });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    bucket: row.bucket,
    saldo: normalizeMoney(row.neto),
  }));
}

export interface BudgetUsage {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  emoji: string | null;
  color: string | null;
  limitAmount: string;
  gastado: string;
}

/** Consumo de los presupuestos de un periodo dentro de su ventana vigente. */
export async function getBudgetUsage(
  period: BudgetPeriod,
  range: DateRange,
): Promise<BudgetUsage[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("budget_usage", {
    p_period: period,
    p_start: range.start,
    p_end: range.end,
  });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    budgetId: row.budget_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    emoji: row.emoji,
    color: row.color,
    limitAmount: normalizeMoney(row.limit_amount),
    gastado: normalizeMoney(row.gastado),
  }));
}
