"use client";

import { useMemo } from "react";

import { getDay } from "date-fns";
import { CalendarDays } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { fromDateKey } from "@/lib/dates";
import { ZERO, abs, formatMoney, toMoney } from "@/lib/money";
import type { DailyBalance } from "@/lib/queries/analytics";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

/** Diámetro del punto como fracción de la celda. */
const MIN_SCALE = 0.22;
const MAX_SCALE = 0.92;

interface Cell {
  day: string;
  neto: bigint;
  scale: number;
}

/**
 * Actividad diaria: un punto por día, verde si el día cerró en superávit y
 * rojo si en déficit, con el diámetro proporcional a la magnitud.
 *
 * Las columnas son `1fr` y las celdas `aspect-square`, así que los puntos
 * escalan con el ancho del contenedor en vez de quedarse a un tamaño fijo
 * centrado. El mismo patrón que ya usa el heatmap del calendario.
 */
export function DailyActivity({
  days,
  currency = "DOP",
}: {
  days: DailyBalance[];
  currency?: string;
}) {
  const { weeks, max, mejor, peor } = useMemo(() => {
    const conDatos = days.filter((d) => toMoney(d.neto) !== ZERO);

    let maxMagnitud = ZERO;
    for (const d of conDatos) {
      const m = abs(toMoney(d.neto));
      if (m > maxMagnitud) maxMagnitud = m;
    }

    // Se coloca cada día en su columna de día de semana (lunes primero).
    const filas: Array<Array<Cell | null>> = [];
    let fila: Array<Cell | null> = Array.from({ length: 7 }, () => null);

    for (const d of days) {
      const fecha = fromDateKey(d.day);
      // getDay: 0 = domingo. Se reindexa a 0 = lunes.
      const col = (getDay(fecha) + 6) % 7;
      const neto = toMoney(d.neto);
      const ratio =
        maxMagnitud === ZERO
          ? 0
          : Number(abs(neto)) / Number(maxMagnitud);

      if (fila[col] !== null) {
        filas.push(fila);
        fila = Array.from({ length: 7 }, () => null);
      }
      fila[col] =
        neto === ZERO
          ? null
          : {
              day: d.day,
              neto,
              scale: MIN_SCALE + (MAX_SCALE - MIN_SCALE) * Math.sqrt(ratio),
            };
    }
    filas.push(fila);

    const ordenados = [...conDatos].sort(
      (a, b) => Number(toMoney(b.neto) - toMoney(a.neto)),
    );

    return {
      weeks: filas,
      max: maxMagnitud,
      mejor: ordenados[0] ?? null,
      peor: ordenados[ordenados.length - 1] ?? null,
    };
  }, [days]);

  if (max === ZERO) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Sin actividad este mes"
        description="Cuando registres movimientos verás aquí el pulso de cada día."
      />
    );
  }

  return (
    <div className="@container">
      <div className="space-y-3">
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[0.65rem] font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Columnas 1fr + celdas cuadradas: los puntos crecen con la tarjeta. */}
        <div className="space-y-1.5">
          {weeks.map((week, i) => (
            <div key={i} className="grid grid-cols-7 gap-1.5">
              {week.map((cell, j) => (
                <div
                  key={cell?.day ?? `${i}-${j}`}
                  className="flex aspect-square items-center justify-center"
                >
                  {cell ? (
                    <span
                      className={cn(
                        "rounded-full transition-transform",
                        cell.neto > ZERO ? "bg-positive" : "bg-negative",
                      )}
                      style={{
                        width: `${cell.scale * 100}%`,
                        height: `${cell.scale * 100}%`,
                      }}
                      title={`${cell.day}: ${formatMoney(cell.neto, currency)}`}
                    />
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-muted" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-positive" />
              Superávit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-negative" />
              Déficit
            </span>
          </span>
          <span>Tamaño = magnitud</span>
        </div>

        {/*
          El espacio sobrante se usa para añadir dato, no para estirar los
          puntos: en tarjetas anchas aparecen el mejor y el peor día.
        */}
        {mejor && peor ? (
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Mejor día</p>
              <p className="tabular text-sm font-semibold text-positive">
                {formatMoney(toMoney(mejor.neto), currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Peor día</p>
              <p className="tabular text-sm font-semibold text-negative">
                {formatMoney(toMoney(peor.neto), currency)}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
