"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * Modo oscuro por defecto; el toggle a claro persiste en localStorage.
 * `enableSystem` deja la preferencia del sistema como fallback inicial.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
