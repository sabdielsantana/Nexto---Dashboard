import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Las escrituras de cookies fallan en Server Components (son de solo lectura);
 * ahí el refresco de sesión lo cubre el middleware.
 */
export function createClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component: el middleware ya refresca la sesión.
        }
      },
    },
  });
}

/**
 * Devuelve el usuario autenticado o `null`.
 * Usa `getUser()` (valida contra el servidor de Auth), no `getSession()`.
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Igual que `getCurrentUser` pero lanza si no hay sesión. Para Server Actions. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  return user;
}
