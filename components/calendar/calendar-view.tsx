"use client";

import { useCallback } from "react";

import { addMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HeatmapCalendar } from "@/components/calendar/heatmap-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMonthYear, fromDateKey, toDateKey } from "@/lib/dates";
import { ZERO, formatMoney, toMoney } from "@/lib/money";
import type { DailyBalance } from "@/lib/queries/analytics";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  month: string;
  days: DailyBalance[];
  selectedDay: string | null;
}

export function CalendarView({ month, days, selectedDay }: CalendarViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const monthDate = fromDateKey(month);

  const navigate = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) params.delete(key);
        else params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Totales del mes visible, sumados sobre el agregado que ya vino de la DB.
  let ingresos = ZERO;
  let gastos = ZERO;
  for (const day of days) {
    ingresos += toMoney(day.ingresos);
    gastos += toMoney(day.gastos);
  }
  const neto = ingresos - gastos;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="text-base capitalize">
          {formatMonthYear(monthDate)}
        </CardTitle>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Mes anterior"
            onClick={() =>
              navigate({ mes: toDateKey(addMonths(monthDate, -1)), dia: undefined })
            }
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({ mes: toDateKey(new Date()), dia: undefined })
            }
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Mes siguiente"
            onClick={() =>
              navigate({ mes: toDateKey(addMonths(monthDate, 1)), dia: undefined })
            }
          >
            <ChevronRight />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <MonthTotal label="Ingresos" value={formatMoney(ingresos)} tone="positive" />
          <MonthTotal label="Gastos" value={formatMoney(gastos)} tone="negative" />
          <MonthTotal
            label="Neto"
            value={formatMoney(neto)}
            tone={neto < ZERO ? "negative" : "positive"}
          />
        </div>

        <HeatmapCalendar
          month={monthDate}
          days={days}
          selectedDay={selectedDay}
          onSelectDay={(day) => navigate({ dia: day })}
        />
      </CardContent>
    </Card>
  );
}

function MonthTotal({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative";
}) {
  return (
    <div className="rounded-md border border-border p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular font-semibold",
          tone === "positive" ? "text-positive" : "text-negative",
        )}
      >
        {value}
      </p>
    </div>
  );
}
