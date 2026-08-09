import { isToday } from "date-fns";

import { type Money, ZERO, abs, formatCompact } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Cinco escalones de intensidad, proporcionales a la magnitud del día. */
export const INTENSITY_STEPS = [0.18, 0.34, 0.52, 0.72, 1] as const;

/**
 * Verde para superávit, rojo para déficit; la opacidad crece con la magnitud
 * relativa al día más fuerte del rango.
 */
export function cellColor(neto: Money, max: Money): string | undefined {
  if (neto === ZERO) return "hsl(var(--muted) / 0.4)";
  if (max === ZERO) return undefined;

  const ratio = Number(abs(neto)) / Number(max);
  const step = INTENSITY_STEPS.find((threshold) => ratio <= threshold) ?? 1;

  const hue = neto > ZERO ? "var(--positive)" : "var(--negative)";
  return `hsl(${hue} / ${step * 0.55})`;
}

/**
 * Caja de una celda. Sin ancho fijo: la columna es `1fr` y la celda cuadrada,
 * así el heatmap escala con su contenedor.
 */
export const HEATMAP_CELL_BOX =
  "relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-xs transition-all";

interface HeatmapCellContentProps {
  date: Date;
  neto: Money;
  hasEntry: boolean;
  currency?: string;
  /**
   * Celdas pequeñas (preview del dashboard): el monto se pinta sin símbolo de
   * moneda. "RD$91.3 K" no cabe en 54px y se salía de la celda.
   */
  dense?: boolean;
}

/**
 * Contenido de una celda: número de día y monto neto compacto.
 *
 * Vive aparte para que el calendario completo y el preview del dashboard
 * compartan formato y no se vayan separando con los cambios.
 */
export function HeatmapCellContent({
  date,
  neto,
  hasEntry,
  currency = "DOP",
  dense = false,
}: HeatmapCellContentProps) {
  return (
    <>
      <span
        className={cn(
          "leading-none",
          isToday(date) && "font-bold text-primary",
          hasEntry ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {date.getDate()}
      </span>

      {/*
        El monto va en color de texto normal, no en verde/rojo: el fondo de la
        celda ya es del mismo tono, y texto verde sobre lavado verde daba
        2.57:1 en tema claro. El signo lo comunica el color de la celda.
      */}
      {hasEntry ? (
        <span
          className={cn(
            "tabular max-w-full overflow-hidden font-semibold leading-none text-foreground",
            dense ? "text-[0.55rem]" : "text-[0.6rem] sm:text-[0.65rem]",
          )}
        >
          {dense ? formatCompactPlain(neto) : formatCompact(neto, currency)}
        </span>
      ) : null}
    </>
  );
}

/** Compacto sin símbolo de moneda, para celdas pequeñas. */
function formatCompactPlain(value: Money): string {
  return new Intl.NumberFormat("es-DO", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) / 100);
}

/** Leyenda compartida de la escala de intensidad. */
export function HeatmapLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-1 text-xs text-muted-foreground">
      {!compact ? (
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-muted/40" />
          Sin actividad
        </span>
      ) : null}
      <span className="flex items-center gap-1">
        Déficit
        {[...INTENSITY_STEPS].reverse().map((step) => (
          <span
            key={step}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: `hsl(var(--negative) / ${step * 0.55})` }}
          />
        ))}
      </span>
      <span className="flex items-center gap-1">
        {INTENSITY_STEPS.map((step) => (
          <span
            key={step}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: `hsl(var(--positive) / ${step * 0.55})` }}
          />
        ))}
        Superávit
      </span>
    </div>
  );
}
