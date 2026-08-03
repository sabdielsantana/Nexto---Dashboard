/**
 * Lectura y validación de las variables de entorno de Supabase.
 * Falla ruidosamente en vez de dejar que el error aparezca como un 401 opaco.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copia .env.example a .env.local y complétalas.",
    );
  }

  return { url, anonKey };
}
