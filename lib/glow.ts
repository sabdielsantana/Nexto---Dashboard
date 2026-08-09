import type { GlowColor } from "@/types/database";

export const GLOW_COLORS: readonly GlowColor[] = [
  "purpura",
  "azul",
  "verde",
  "naranja",
  "rosa",
  "ninguno",
];

export const GLOW_LABELS: Record<GlowColor, string> = {
  purpura: "Púrpura",
  azul: "Azul",
  verde: "Verde",
  naranja: "Naranja",
  rosa: "Rosa",
  ninguno: "Sin glow",
};

/**
 * Tono base de cada ambiente, como triplete HSL sin envolver — igual que los
 * tokens de globals.css, para poder componer opacidad con `hsl(... / x)`.
 *
 * El glow se pinta muy por debajo del contenido y con opacidad baja: es
 * ambiente, no superficie. Las tarjetas tienen fondo sólido, así que el
 * contraste del texto sobre ellas no depende de este valor.
 */
export const GLOW_HUES: Record<GlowColor, string | null> = {
  purpura: "263 90% 60%",
  azul: "213 94% 58%",
  verde: "142 71% 45%",
  naranja: "27 96% 55%",
  rosa: "330 85% 60%",
  ninguno: null,
};

/** Muestra sólida para el selector de ambiente. */
export function glowSwatch(color: GlowColor): string {
  const hue = GLOW_HUES[color];
  return hue ? `hsl(${hue})` : "transparent";
}
