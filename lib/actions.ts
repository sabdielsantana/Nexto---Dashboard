import type { PostgrestError } from "@supabase/supabase-js";

/** Resultado uniforme de toda Server Action de mutación. */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export const ACTION_OK: ActionResult = { ok: true };

export function actionError(message: string): ActionResult {
  return { ok: false, error: message };
}

/** Traduce errores de Postgres a mensajes accionables en español. */
export function describeDbError(error: PostgrestError): string {
  switch (error.code) {
    case "23505":
      return "Ya existe un registro con esos datos.";
    case "23503":
      return "No se puede completar: hay registros relacionados.";
    case "23514":
      return "Alguno de los valores no cumple las reglas de la base de datos.";
    case "42501":
      return "No tienes permiso para esta operación.";
    default:
      return error.message || "Ocurrió un error inesperado.";
  }
}

/** Extrae un texto obligatorio del FormData. */
export function requiredText(
  formData: FormData,
  field: string,
): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value === "" ? null : value;
}

/** Extrae un texto opcional; devuelve `null` si viene vacío. */
export function optionalText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value === "" ? null : value;
}

/** Valida que un valor pertenezca a un conjunto de literales. */
export function parseEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
): T | null {
  const raw = String(value ?? "");
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
}
