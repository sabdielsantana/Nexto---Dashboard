"use client";

import { useMemo } from "react";

import { isSameMonth, isToday } from "date-fns";

import type { DailyBalance } from "@/lib/queries/analytics";
import {
  ZERO,
  abs,
  formatCompact,
  toMoney,
} from "@/lib/money";
import { calendarDays, toDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Cinco escalones de intensidad, proporcionales a la magnitud del día. */
const INTENSITY_STEPS = [0.18, 0.34, 0.52, 0.72, 1] as const;

interface HeatmapCalendarProps {
  month: Date;
  days: DailyBalance[];
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  currency?: string;
}

export function HeatmapCalendar({
  month,
  days,
  selectedDay,
  onSelectDay,
  currency = "DOP",
}: HeatmapCalendarProps) {
  const byDay = useMemo(
    () => new Map(days.map((entry) => [entry.day, entry])),
    [days],
  );

  // La escala se normaliza contra el día de mayor magnitud del mes, así el
  // contraste se mantiene tanto en meses tranquilos como en meses intensos.
  const maxMagnitude = useMemo(() => {
    let max = ZERO;
    for (const entry of days) {
      const magnitude = abs(toMoney(entry.neto));
      if (magnitude > max) max = magnitude;
    }
    return max;
  }, [days]);

  const grid = useMemo(() => calendarDays(month), [month]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="pb-1 text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {grid.map((date) => {
          const key = toDateKey(date);
          const entry = byDay.get(key);
          const neto = entry ? toMoney(entry.neto) : ZERO;
          const inMonth = isSameMonth(date, month);
          const selected = selectedDay === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(key)}
              aria-label={`${key}${entry ? `, balance ${entry.neto}` : ", sin actividad"}`}
              aria-pressed={selected}
              className={cn(
                "group relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-xs transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                inMonth ? "border-border" : "border-transparent opacity-40",
                selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                !entry && "bg-muted/30 hover:bg-muted/60",
              )}
              style={
                entry
                  ? { backgroundColor: cellColor(neto, maxMagnitude) }
                  : undefined
              }
            >
              <span
                className={cn(
                  "leading-none",
                  isToday(date) && "font-bold text-primary",
                  entry ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {date.getDate()}
              </span>

              {entry ? (
                <span
                  className={cn(
                    "tabular text-[0.6rem] font-semibold leading-none sm:text-[0.65rem]",
                    neto < ZERO ? "text-negative" : "text-positive",
                  )}
                >
                  {formatCompact(neto, currency)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}

/**
 * Verde para superávit, rojo para déficit; la opacidad crece con la magnitud
 * relativa al día más fuerte del mes.
 */
function cellColor(neto: bigint, max: bigint): string | undefined {
  if (neto === ZERO) return "hsl(var(--muted) / 0.4)";
  if (max === ZERO) return undefined;

  const ratio = Number(abs(neto)) / Number(max);
  const step =
    INTENSITY_STEPS.find((threshold) => ratio <= threshold) ?? 1;

  const hue = neto > ZERO ? "var(--positive)" : "var(--negative)";
  return `hsl(${hue} / ${step * 0.55})`;
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-muted/40" />
        Sin actividad
      </span>
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
