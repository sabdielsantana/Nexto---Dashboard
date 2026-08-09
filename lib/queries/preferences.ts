import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { GlowColor } from "@/types/database";

export const DEFAULT_GLOW: GlowColor = "purpura";

export interface UserPrefs {
  glow: GlowColor;
}

/**
 * Preferencias de interfaz del usuario actual.
 *
 * La fila puede no existir todavía —se crea al guardar por primera vez—, así
 * que se cae al valor por defecto en vez de tratarlo como error. Lo mismo si
 * la migración 0003 aún no se ha aplicado: el fondo sale con el ambiente por
 * defecto en lugar de tumbar la página entera.
 */
export async function getUserPrefs(): Promise<UserPrefs> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_preferences")
    .select("glow")
    .maybeSingle();

  if (error || !data) return { glow: DEFAULT_GLOW };

  return { glow: data.glow };
}
