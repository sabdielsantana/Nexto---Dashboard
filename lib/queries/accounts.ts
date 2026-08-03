import "server-only";

import { normalizeMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/types/database";

/**
 * Cuenta con su saldo consolidado.
 * Los montos viajan como cadena decimal — ver `normalizeMoney`.
 */
export interface AccountWithBalance {
  id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  currency: string;
  /** Saldo inicial/base tal como está en `accounts.balance`. */
  saldoBase: string;
  /** Saldo real = base + ingresos − gastos. Viene de `account_balances`. */
  saldoActual: string;
}

/**
 * Lista las cuentas con su saldo actual.
 *
 * El saldo sale siempre de la vista `account_balances` (regla del proyecto:
 * `accounts.balance` es solo el saldo base, nunca el saldo mostrado). Se leen
 * ambas fuentes porque la vista no expone `institution`.
 */
export async function getAccountsWithBalances(): Promise<AccountWithBalance[]> {
  const supabase = createClient();

  const [accountsResult, balancesResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, institution, balance, currency")
      .order("created_at", { ascending: true }),
    supabase.from("account_balances").select("account_id, saldo_actual"),
  ]);

  if (accountsResult.error) throw accountsResult.error;
  if (balancesResult.error) throw balancesResult.error;

  const saldoPorCuenta = new Map(
    (balancesResult.data ?? []).map((row) => [
      row.account_id,
      normalizeMoney(row.saldo_actual),
    ]),
  );

  return (accountsResult.data ?? []).map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    institution: account.institution,
    currency: account.currency,
    saldoBase: normalizeMoney(account.balance),
    saldoActual:
      saldoPorCuenta.get(account.id) ?? normalizeMoney(account.balance),
  }));
}

/** Opciones mínimas de cuenta para los selectores de formularios. */
export interface AccountOption {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
}

export async function getAccountOptions(): Promise<AccountOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, type, currency")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
