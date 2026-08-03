"use server";

import { revalidatePath } from "next/cache";

import {
  ACTION_OK,
  type ActionResult,
  actionError,
  describeDbError,
  parseEnum,
  requiredText,
} from "@/lib/actions";
import { BUDGET_PERIODS } from "@/lib/constants";
import { ZERO, parseMoneyString, toDbString } from "@/lib/money";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { BudgetPeriod } from "@/types/database";

interface BudgetInput {
  category_id: string;
  period: BudgetPeriod;
  limit_amount: string;
}

function parseBudgetForm(formData: FormData): BudgetInput | string {
  const categoryId = requiredText(formData, "category_id");
  if (!categoryId) return "Selecciona una categoría.";

  const period = parseEnum(formData.get("period"), BUDGET_PERIODS);
  if (!period) return "Selecciona un periodo válido.";

  const limit = parseMoneyString(String(formData.get("limit_amount") ?? ""));
  if (limit <= ZERO) return "El límite debe ser mayor que cero.";

  return {
    category_id: categoryId,
    period,
    limit_amount: toDbString(limit),
  };
}

export async function createBudget(formData: FormData): Promise<ActionResult> {
  const parsed = parseBudgetForm(formData);
  if (typeof parsed === "string") return actionError(parsed);

  const user = await requireUser();
  const supabase = createClient();

  const { error } = await supabase
    .from("budgets")
    .insert({ ...parsed, user_id: user.id });

  if (error) {
    // El índice único (user_id, category_id, period) impide duplicados.
    if (error.code === "23505") {
      return actionError(
        "Ya existe un presupuesto para esa categoría en ese periodo.",
      );
    }
    return actionError(describeDbError(error));
  }

  revalidatePath("/presupuestos");
  revalidatePath("/");
  return ACTION_OK;
}

export async function updateBudget(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseBudgetForm(formData);
  if (typeof parsed === "string") return actionError(parsed);

  await requireUser();
  const supabase = createClient();

  const { error } = await supabase.from("budgets").update(parsed).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return actionError(
        "Ya existe un presupuesto para esa categoría en ese periodo.",
      );
    }
    return actionError(describeDbError(error));
  }

  revalidatePath("/presupuestos");
  revalidatePath("/");
  return ACTION_OK;
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = createClient();

  const { error } = await supabase.from("budgets").delete().eq("id", id);

  if (error) return actionError(describeDbError(error));

  revalidatePath("/presupuestos");
  revalidatePath("/");
  return ACTION_OK;
}
