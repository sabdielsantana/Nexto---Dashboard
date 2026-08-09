"use client";

import { useMemo } from "react";

import { getDay } from "date-fns";

import {
  HEATMAP_CELL_BOX,
  HeatmapCellContent,
  HeatmapLegend,
  cellColor,
} from "@/components/calendar/heatmap-cell";
import { toDateKey } from "@/lib/dates";
import { ZERO, abs, formatMoney, formatSigned, toMoney } from "@/lib/money";
import type { DailyBalance } from "@/lib/queries/analytics";
import { cn } from "@/lib/utils";

/** Misma convención que el resto de la app (miércoles = X). */
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

interface CalendarPreviewProps {
  /** Los 7 días que se muestran, del más antiguo al más reciente. */
  days: Date[];
  balances: DailyBalance[];
  currency?: string;
}

/**
 * Vista previa del calendario: solo los últimos 7 días.
 *
 * Reutiliza la celda del heatmap completo (`heatmap-cell`) para que preview y
 * página no se separen. El mes entero no cabe legible en una tarjeta del
 * dashboard, y además duplicaría lo que ya cuenta "Actividad diaria".
 *
 * Sigue el criterio de la fase 1: al ensanchar la tarjeta las celdas no se
 * estiran —siguen cuadradas, con columnas 1fr— y el hueco se gasta en revelar
 * el resumen de la semana.
 */
export function CalendarPreview({
  days,
  balances,
  currency = "DOP",
}: CalendarPreviewProps) {
  const { byDay, max, neto, conActividad } = useMemo(() => {
    const map = new Map(balances.map((b) => [b.day, b]));

    let maxMagnitud = ZERO;
    let suma = ZERO;
    let activos = 0;

    for (const date of days) {
      const entry = map.get(toDateKey(date));
      if (!entry) continue;
      const n = toMoney(entry.neto);
      suma += n;
      if (n !== ZERO) activos += 1;
      const m = abs(n);
      if (m > maxMagnitud) maxMagnitud = m;
    }

    return { byDay: map, max: maxMagnitud, neto: suma, conActividad: activos };
  }, [days, balances]);

  return (
    /*
     * En tarjetas anchas el heatmap se topa a 26rem y el resto del espacio lo
     * ocupa el resumen. Sin el tope, siete celdas cuadradas repartidas en todo
     * el ancho crecen hasta 130px: eso es estirar, no revelar.
     */
    <div className="@container">
      <div className="grid gap-5 @2xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] @2xl:items-center">
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((date) => (
              <div
                key={`h-${toDateKey(date)}`}
                className="text-center text-[0.65rem] font-medium text-muted-foreground"
              >
                {WEEKDAYS[(getDay(date) + 6) % 7]}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
        {days.map((date) => {
          const key = toDateKey(date);
          const entry = byDay.get(key);
          const valor = entry ? toMoney(entry.neto) : ZERO;

          return (
            <div
              key={key}
              className={cn(
                HEATMAP_CELL_BOX,
                entry ? "border-border" : "border-transparent bg-muted/30",
              )}
              style={entry ? { backgroundColor: cellColor(valor, max) } : undefined}
              title={`${key}: ${entry ? formatMoney(valor, currency) : "sin actividad"}`}
            >
              <HeatmapCellContent
                date={date}
                neto={valor}
                hasEntry={entry !== undefined}
                currency={currency}
                dense
              />
            </div>
              );
            })}
          </div>

          <HeatmapLegend compact />
        </div>

        {/*
          El espacio sobrante se convierte en dato, no en celdas más grandes.
          En columna estrecha va debajo; en tarjeta ancha, al lado.
        */}
        <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 @2xl:grid-cols-1 @2xl:border-l @2xl:border-t-0 @2xl:pl-5 @2xl:pt-0">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Neto de 7 días</dt>
            <dd
              className={cn(
                "tabular text-lg font-bold",
                neto < ZERO ? "text-negative-fg" : "text-positive-fg",
              )}
            >
              {formatSigned(neto, currency)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Días con actividad</dt>
            <dd className="tabular text-lg font-bold">{conActividad} de 7</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
