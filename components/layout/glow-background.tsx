import { GLOW_HUES } from "@/lib/glow";
import type { GlowColor } from "@/types/database";

/**
 * Halo difuminado de fondo.
 *
 * Va detrás de todo (`-z-10`) y no captura eventos. La opacidad es baja a
 * propósito: el contenido vive sobre tarjetas de fondo sólido, así que el
 * glow es ambiente y nunca la superficie sobre la que se lee texto. En claro
 * se atenúa más porque sobre blanco satura antes.
 */
export function GlowBackground({ color }: { color: GlowColor }) {
  const hue = GLOW_HUES[color];
  if (!hue) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-1/3 left-1/2 h-[70vh] w-[85vw] -translate-x-1/2 rounded-full opacity-[0.16] blur-[120px] dark:opacity-30"
        style={{ backgroundColor: `hsl(${hue})` }}
      />
      <div
        className="absolute bottom-0 right-0 h-[45vh] w-[45vw] translate-x-1/4 translate-y-1/4 rounded-full opacity-[0.10] blur-[120px] dark:opacity-20"
        style={{ backgroundColor: `hsl(${hue})` }}
      />
    </div>
  );
}
