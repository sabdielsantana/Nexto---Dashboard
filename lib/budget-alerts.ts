import { percentOf, toMoney } from "@/lib/money";
import type { BudgetUsage } from "@/lib/queries/analytics";

/**
 * Umbral (%) a partir del cual un presupuesto se considera "en alerta".
 * Vive aquí, en un módulo neutral, para ser la única fuente de verdad tanto
 * del componente cliente `BudgetAlerts` como del predicado que usa la página
 * en el servidor. No lo importes desde un módulo `"use client"`: al cruzar la
 * frontera RSC dejaría de ser invocable en el servidor.
 */
export const BUDGET_WARNING_THRESHOLD = 80;

/** Un `BudgetUsage` está en alerta cuando alcanza el umbral. */
export function isBudgetAlert(entry: BudgetUsage): boolean {
  const limit = toMoney(entry.limitAmount);
  const spent = toMoney(entry.gastado);
  return percentOf(spent, limit) >= BUDGET_WARNING_THRESHOLD;
}

/**
 * Hay algo que mostrar cuando algún presupuesto llega al umbral de alerta. La
 * página lo usa para decidir si monta el widget en el grid (y así no reservar
 * un hueco vacío).
 */
export function hasBudgetAlerts(usage: BudgetUsage[]): boolean {
  return usage.some(isBudgetAlert);
}
