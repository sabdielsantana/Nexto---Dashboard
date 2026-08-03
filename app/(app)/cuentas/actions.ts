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
import { CURRENCIES } from "@/lib/constants";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { parseMoneyString, toDbString } from "@/lib/money";
import { createClient, requireUser } from "@/lib/supabase/server";

/** Rutas que muestran saldos y deben refrescarse tras cualquier cambio. */
function revalidateAccountViews() {
  revalidatePath("/cuentas");
  revalidatePath("/");
  revalidatePath("/transacciones");
  revalidatePath("/analitica");
}

interface AccountInput {
  name: string;
  type: (typeof ACCOUNT_TYPES)[number];
  institution: string | null;
  balance: string;
  currency: string;
}

function parseAccountForm(formData: FormData): AccountInput | string {
  const name = requiredText(formData, "name");
  if (!name) return "El nombre de la cuenta es obligatorio.";

  const type = parseEnum(formData.get("type"), ACCOUNT_TYPES);
  if (!type) return "Selecciona un tipo de cuenta válido.";

  const currency = parseEnum(formData.get("currency"), CURRENCIES);
  if (!currency) return "Selecciona una moneda válida.";

  // El saldo base puede ser negativo (p.ej. una tarjeta de crédito con deuda).
  const balance = parseMoneyString(String(formData.get("balance") ?? "0"));

  return {
    name,
    type,
    institution: optionalText(formData, "institution"),
    balance: toDbString(balance),
    currency,
  };
}

export async function createAccount(formData: FormData): Promise<ActionResult> {
  const parsed = parseAccountForm(formData);
  if (typeof parsed === "string") return actionError(parsed);

  const user = await requireUser();
  const supabase = createClient();

  const { error } = await supabase
    .from("accounts")
    .insert({ ...parsed, user_id: user.id });

  if (error) return actionError(describeDbError(error));

  revalidateAccountViews();
  return ACTION_OK;
}

export async function updateAccount(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseAccountForm(formData);
  if (typeof parsed === "string") return actionError(parsed);

  await requireUser();
  const supabase = createClient();

  // El RLS ya restringe la fila al dueño; no hace falta filtrar por user_id.
  const { error } = await supabase.from("accounts").update(parsed).eq("id", id);

  if (error) return actionError(describeDbError(error));

  revalidateAccountViews();
  return ACTION_OK;
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = createClient();

  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) return actionError(describeDbError(error));

  revalidateAccountViews();
  return ACTION_OK;
}
