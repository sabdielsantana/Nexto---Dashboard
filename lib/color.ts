/**
 * Utilidades de contraste según WCAG 2.1.
 *
 * Se usan donde el fondo es un color arbitrario elegido por la persona
 * usuaria y por tanto no hay forma de fijar el color de texto por adelantado.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Tintas candidatas para dibujar sobre un color arbitrario. */
export const INK_LIGHT = "#ffffff";
export const INK_DARK = "#000000";

/**
 * Parsea `#rgb` o `#rrggbb`. Devuelve `null` si no reconoce el formato, para
 * que quien llame decida el fallback en vez de recibir un color inventado.
 */
export function parseHexColor(hex: string): Rgb | null {
  const value = hex.trim().replace(/^#/, "");

  if (/^[0-9a-f]{3}$/i.test(value)) {
    const [r, g, b] = [...value].map((c) => Number.parseInt(c + c, 16));
    return { r: r ?? 0, g: g ?? 0, b: b ?? 0 };
  }

  if (/^[0-9a-f]{6}$/i.test(value)) {
    return {
      r: Number.parseInt(value.slice(0, 2), 16),
      g: Number.parseInt(value.slice(2, 4), 16),
      b: Number.parseInt(value.slice(4, 6), 16),
    };
  }

  return null;
}

/** Linealización de un canal sRGB (WCAG 2.1, 8-bit). */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Luminancia relativa (0 = negro, 1 = blanco), según la definición de WCAG 2.1.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Ratio de contraste entre dos colores (1:1 a 21:1), según WCAG 2.1.
 * WCAG AA pide 4.5:1 para texto normal y 3:1 para texto grande e iconos.
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Elige entre tinta clara y oscura la que más contraste da sobre `background`.
 *
 * Se compara el contraste real en vez de aplicar un umbral fijo de luminancia:
 * el umbral correcto depende de la tinta oscura concreta (para negro puro cae
 * en L≈0.179) y un valor a ojo se equivoca justo en los tonos medios. Con la
 * paleta de categorías, comparar contrastes deja el peor caso en 4.76:1;
 * un umbral de 0.35 lo dejaba en 2.77:1.
 *
 * Si el color no se puede parsear se devuelve la tinta clara, que es el
 * comportamiento previo.
 */
export function readableInkOn(background: string): string {
  const rgb = parseHexColor(background);
  if (!rgb) return INK_LIGHT;

  const light = parseHexColor(INK_LIGHT);
  const dark = parseHexColor(INK_DARK);
  if (!light || !dark) return INK_LIGHT;

  return contrastRatio(rgb, dark) > contrastRatio(rgb, light)
    ? INK_DARK
    : INK_LIGHT;
}
