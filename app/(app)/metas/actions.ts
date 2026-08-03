"use server";

import { revalidatePath } from "next/cache";

import {
  ACTION_OK,
  type ActionResult,
  actionError,
  describeDbError,
  optionalText,
  requiredText,
} from "@/lib/actions";
import { ZERO, parseMoneyString, toDbString, toMoney } from "@/lib/money";
import { createClient, requireUser } from "@/lib/supabase/server";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface GoalInput {
  name: string;
  emoji: string | null;
  target_amount: string;
  current_amount: string;
  deadline: string;
}

function parseGoalForm(formData: FormData): GoalInput | string {
  const name = requiredText(formData, "name");
  if (!name) return "El nombre de la meta es obligatorio.";

  const target = parseMoneyString(String(formData.get("target_amount") ?? ""));
  if (target <= ZERO) return "El monto objetivo debe ser mayor que cero.";

  const current = parseMoneyString(String(formData.get("current_amount") ?? "0"));
  if (current < ZERO) return "El monto ahorrado no puede ser negativo.";

  const deadline = requiredText(formData, "deadline");
  if (!deadline || !ISO_DATE.test(deadline)) {
    return "Indica una fecha límite válida.";
  }

  return {
    name,
    emoji: optionalText(formData, "emoji"),
    target_amount: toDbString(target),
    current_amount: toDbString(current),
    deadline,
  };
}

export async function createGoal(formData: FormData): Promise<ActionResult> {
  const parsed = parseGoalForm(formData);
  if (typeof parsed === "string") return actionError(parsed);

  const user = await requireUser();
  const supabase = createClient();

  const { error } = await supabase
    .from("goals")
    .insert({ ...parsed, user_id: user.id });

  if (error) return actionError(describeDbError(error));

  revalidatePath("/metas");
  revalidatePath("/");
  return ACTION_OK;
}

export async function updateGoal(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseGoalForm(formData);
  if (typeof parsed === "string") return actionError(parsed);

  await requireUser();
  const supabase = createClient();

  const { error } = await supabase.from("goals").update(parsed).eq("id", id);

  if (error) return actionError(describeDbError(error));

  revalidatePath("/metas");
  revalidatePath("/");
  return ACTION_OK;
}

/**
 * Suma (o resta, si el monto es negativo) un aporte al ahorro acumulado.
 * Se lee el valor actual antes de escribir; el constraint
 * `current_amount >= 0` de la DB protege el límite inferior.
 */
export async function contributeToGoal(
  id: string,
  rawAmount: string,
): Promise<ActionResult> {
  const delta = parseMoneyString(rawAmount);
  if (delta === ZERO) return actionError("Indica un monto distinto de cero.");

  await requireUser();
  const supabase = createClient();

  const { data, error: readError } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("id", id)
    .single();

  if (readError) return actionError(describeDbError(readError));

  const next = toMoney(data.current_amount) + delta;
  if (next < ZERO) {
    return actionError("No puedes retirar más de lo ahorrado.");
  }

  const { error } = await supabase
    .from("goals")
    .update({ current_amount: toDbString(next) })
    .eq("id", id);

  if (error) return actionError(describeDbError(error));

  revalidatePath("/metas");
  revalidatePath("/");
  return ACTION_OK;
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = createClient();

  const { error } = await supabase.from("goals").delete().eq("id", id);

  if (error) return actionError(describeDbError(error));

  revalidatePath("/metas");
  revalidatePath("/");
  return ACTION_OK;
}
