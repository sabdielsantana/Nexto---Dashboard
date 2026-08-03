import "server-only";

import type { DateRange } from "@/lib/dates";
import { normalizeMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { TransactionType } from "@/types/database";

export interface TransactionRow {
  id: string;
  type: TransactionType;
  /** Monto siempre positivo; el signo lo determina `type`. */
  amount: string;
  date: string;
  note: string | null;
  isRecurring: boolean;
  accountId: string;
  accountName: string;
  accountCurrency: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryEmoji: string | null;
  categoryColor: string | null;
}

export interface TransactionFilters {
  range: DateRange;
  accountId?: string | undefined;
  categoryId?: string | undefined;
  type?: TransactionType | undefined;
  limit?: number;
}

/** Forma que devuelve PostgREST al expandir las relaciones embebidas. */
interface RawTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string | null;
  is_recurring: boolean;
  account_id: string;
  category_id: string | null;
  accounts: { name: string; currency: string } | null;
  categories: { name: string; emoji: string | null; color: string | null } | null;
}

function mapTransaction(row: RawTransaction): TransactionRow {
  return {
    id: row.id,
    type: row.type,
    amount: normalizeMoney(row.amount),
    date: row.date,
    note: row.note,
    isRecurring: row.is_recurring,
    accountId: row.account_id,
    accountName: row.accounts?.name ?? "Cuenta eliminada",
    accountCurrency: row.accounts?.currency ?? "DOP",
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    categoryEmoji: row.categories?.emoji ?? null,
    categoryColor: row.categories?.color ?? null,
  };
}

const SELECT_WITH_RELATIONS =
  "id, type, amount, date, note, is_recurring, account_id, category_id, accounts(name, currency), categories(name, emoji, color)";

/** Transacciones del rango, con cuenta y categoría resueltas. */
export async function getTransactions(
  filters: TransactionFilters,
): Promise<TransactionRow[]> {
  const supabase = createClient();

  let query = supabase
    .from("transactions")
    .select(SELECT_WITH_RELATIONS)
    .gte("date", filters.range.start)
    .lte("date", filters.range.end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 500);

  if (filters.accountId) query = query.eq("account_id", filters.accountId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.type) query = query.eq("type", filters.type);

  const { data, error } = await query.returns<RawTransaction[]>();
  if (error) throw error;

  return (data ?? []).map(mapTransaction);
}

/** Últimas transacciones sin filtro de fecha — para el dashboard. */
export async function getRecentTransactions(
  limit = 8,
): Promise<TransactionRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(SELECT_WITH_RELATIONS)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<RawTransaction[]>();

  if (error) throw error;
  return (data ?? []).map(mapTransaction);
}

/** Transacciones de un día concreto — usado al hacer click en el heatmap. */
export async function getTransactionsForDay(
  day: string,
): Promise<TransactionRow[]> {
  return getTransactions({ range: { start: day, end: day } });
}
