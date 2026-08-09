"use server";

import { revalidatePath } from "next/cache";

import {
  ACTION_OK,
  type ActionResult,
  actionError,
  describeDbError,
  parseEnum,
} from "@/lib/actions";
import { GLOW_COLORS } from "@/lib/glow";
import { createClient, requireUser } from "@/lib/supabase/server";

/** Guarda el ambiente (color del glow) del usuario actual. */
export async function setGlow(value: string): Promise<ActionResult> {
  const glow = parseEnum(value, GLOW_COLORS);
  if (!glow) return actionError("Ambiente no válido.");

  const user = await requireUser();
  const supabase = createClient();

  // upsert: la fila no existe hasta que se guarda una preferencia por primera
  // vez. La PK es user_id, así que no hacen falta más claves de conflicto.
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, glow }, { onConflict: "user_id" });

  if (error) return actionError(describeDbError(error));

  revalidatePath("/", "layout");
  return ACTION_OK;
}
