"use client";

import { useMemo } from "react";

import { isSameMonth } from "date-fns";

import type { DailyBalance } from "@/lib/queries/analytics";
import { ZERO, abs, toMoney } from "@/lib/money";
import { calendarDays, toDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  HEATMAP_CELL_BOX,
  HeatmapCellContent,
  HeatmapLegend,
  cellColor,
} from "@/components/calendar/heatmap-cell";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];


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
                HEATMAP_CELL_BOX,
                "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
              <HeatmapCellContent
                date={date}
                neto={neto}
                hasEntry={entry !== undefined}
                currency={currency}
              />
            </button>
          );
        })}
      </div>

      <HeatmapLegend />
    </div>
  );
}


