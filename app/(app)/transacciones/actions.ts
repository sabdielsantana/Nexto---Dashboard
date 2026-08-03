"use server";

import { revalidatePath } from "next/cache";

import {
  ACTION_OK,
  type ActionResult,
  actionError,
  describeDbError,
  optionalText,
  parseEnum,
  requiredText,
} from "@/lib/actions";
import { ZERO, parseMoneyString, toDbString } from "@/lib/money";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { TransactionType } from "@/types/database";

const TRANSACTION_TYPES: readonly TransactionType[] = ["ingreso", "gasto"];

/** Casi todas las vistas dependen de las transacciones. */
function revalidateTransactionViews() {
  revalidatePath("/transacciones");
  revalidatePath("/calendario");
  revalidatePath("/cuentas");
  revalidatePath("/presupuestos");
  revalidatePath("/analitica");
  revalidatePath("/");
}

interface TransactionInput {
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: string;
  date: string;
  note: string | null;
  is_recurring: boolean;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseTransactionForm(formData: FormData): TransactionInput | string {
  const accountId = requiredText(formData, "account_id");
  if (!accountId) return "Selecciona una cuenta.";

  const type = parseEnum(formData.get("type"), TRANSACTION_TYPES);
  if (!type) return "Selecciona si es un ingreso o un gasto.";

  const amount = parseMoneyString(String(formData.get("amount") ?? ""));
  if (amount <= ZERO) {
    return "El monto debe ser mayor que cero.";
  }

  const date = requiredText(formData, "date");
  if (!date || !ISO_DATE.test(date)) return "Indica una fecha válida.";

  const categoryId = optionalText(formData, "category_id");

  return {
    account_id: accountId,
    // "none" es el centinela del select para "sin categoría".
    category_id: categoryId === "none" ? null : categoryId,
    type,
    amount: toDbString(amount),
    date,
    note: optionalText(formData, "note"),
    is_recurring: formData.get("is_recurring") === "on",
  };
}

export async function createTransaction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseTransactionForm(formData);
  if (typeof parsed === "string") return actionError(parsed);

  const user = await requireUser();
  const supabase = createClient();

  const { error } = await supabase
    .from("transactions")
    .insert({ ...parsed, user_id: user.id });

  if (error) return actionError(describeDbError(error));

  revalidateTransactionViews();
  return ACTION_OK;
}

export async function updateTransaction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseTransactionForm(formData);
  if (typeof parsed === "string") return actionError(parsed);

  await requireUser();
  const supabase = createClient();

  const { error } = await supabase
    .from("transactions")
    .update(parsed)
    .eq("id", id);

  if (error) return actionError(describeDbError(error));

  revalidateTransactionViews();
  return ACTION_OK;
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = createClient();

  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) return actionError(describeDbError(error));

  revalidateTransactionViews();
  return ACTION_OK;
}
