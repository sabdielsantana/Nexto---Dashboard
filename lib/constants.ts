import type { AccountType, BudgetPeriod, TransactionType } from "@/types/database";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  debito: "Débito",
  credito: "Crédito",
  efectivo: "Efectivo",
  inversion: "Inversión / Broker",
  banca_nacional: "Banca nacional",
};

export const ACCOUNT_TYPES: readonly AccountType[] = [
  "debito",
  "credito",
  "efectivo",
  "inversion",
  "banca_nacional",
];

/** Color por tipo de cuenta — usado en la barra de distribución de activos. */
export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  debito: "hsl(213 94% 62%)",
  credito: "hsl(0 84% 62%)",
  efectivo: "hsl(142 71% 48%)",
  inversion: "hsl(271 91% 68%)",
  banca_nacional: "hsl(27 96% 56%)",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  ingreso: "Ingreso",
  gasto: "Gasto",
};

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  semanal: "Semanal",
  mensual: "Mensual",
  anual: "Anual",
};

export const BUDGET_PERIODS: readonly BudgetPeriod[] = [
  "semanal",
  "mensual",
  "anual",
];

/** Monedas soportadas en el selector de cuentas. */
export const CURRENCIES = ["DOP", "USD", "EUR"] as const;

/** Paleta para categorías sin color asignado y para series de gráficos. */
export const CHART_PALETTE = [
  "hsl(263 90% 66%)",
  "hsl(213 94% 62%)",
  "hsl(142 71% 48%)",
  "hsl(27 96% 56%)",
  "hsl(340 82% 62%)",
  "hsl(187 85% 47%)",
  "hsl(48 96% 58%)",
  "hsl(271 91% 68%)",
  "hsl(0 84% 62%)",
  "hsl(160 84% 45%)",
] as const;

export function paletteColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length] ?? CHART_PALETTE[0];
}

/** Colores predefinidos que ofrece el selector de color de categorías. */
export const CATEGORY_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#a855f7",
  "#64748b",
  "#0ea5e9",
] as const;

/** Emojis frecuentes para categorías, agrupados por tema. */
export const CATEGORY_EMOJIS = [
  "🏠", "🍔", "🛒", "🚗", "⛽", "🚌", "✈️", "🏥", "💊", "🎓",
  "📚", "💡", "💧", "📱", "🌐", "🎬", "🎮", "🎵", "👕", "👟",
  "💇", "🏋️", "🐶", "🎁", "💸", "💼", "💰", "🏦", "📈", "🧾",
  "🍺", "☕", "🍕", "🧹", "🔧", "🛠️", "🧳", "❤️", "⭐", "🎯",
] as const;
