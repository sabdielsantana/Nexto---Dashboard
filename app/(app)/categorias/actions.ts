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
import { createClient, requireUser } from "@/lib/supabase/server";

function revalidateCategoryViews() {
  revalidatePath("/categorias");
  revalidatePath("/transacciones");
  revalidatePath("/presupuestos");
  revalidatePath("/analitica");
  revalidatePath("/");
}

interface CategoryInput {
  name: string;
  emoji: string | null;
  color: string | null;
  parent_category_id: string | null;
}

function parseCategoryForm(formData: FormData): CategoryInput | string {
  const name = requiredText(formData, "name");
  if (!name) return "El nombre de la categoría es obligatorio.";

  const parent = optionalText(formData, "parent_category_id");

  return {
    name,
    emoji: optionalText(formData, "emoji"),
    color: optionalText(formData, "color"),
    // "none" es el valor centinela del select cuando es categoría raíz.
    parent_category_id: parent === "none" ? null : parent,
  };
}

export async function createCategory(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseCategoryForm(formData);
  if (typeof parsed === "string") return actionError(parsed);

  const user = await requireUser();
  const supabase = createClient();

  const { error } = await supabase
    .from("categories")
    .insert({ ...parsed, user_id: user.id });

  if (error) return actionError(describeDbError(error));

  revalidateCategoryViews();
  return ACTION_OK;
}

export async function updateCategory(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseCategoryForm(formData);
  if (typeof parsed === "string") return actionError(parsed);

  if (parsed.parent_category_id === id) {
    return actionError("Una categoría no puede ser su propia categoría padre.");
  }

  await requireUser();
  const supabase = createClient();

  // Evita ciclos: el nuevo padre no puede ser descendiente de esta categoría.
  if (parsed.parent_category_id) {
    const { data, error: readError } = await supabase
      .from("categories")
      .select("id, parent_category_id");

    if (readError) return actionError(describeDbError(readError));

    const parentOf = new Map(
      (data ?? []).map((row) => [row.id, row.parent_category_id]),
    );

    let cursor: string | null = parsed.parent_category_id;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === id) {
        return actionError(
          "No puedes mover la categoría dentro de una de sus subcategorías.",
        );
      }
      if (visited.has(cursor)) break;
      visited.add(cursor);
      cursor = parentOf.get(cursor) ?? null;
    }
  }

  const { error } = await supabase
    .from("categories")
    .update(parsed)
    .eq("id", id);

  if (error) return actionError(describeDbError(error));

  revalidateCategoryViews();
  return ACTION_OK;
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireUser();
  const supabase = createClient();

  // Las subcategorías quedan como raíz (ON DELETE SET NULL) y las
  // transacciones pierden la categoría, no se borran.
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return actionError(describeDbError(error));

  revalidateCategoryViews();
  return ACTION_OK;
}
