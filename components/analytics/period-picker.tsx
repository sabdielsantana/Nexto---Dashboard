"use client";

import { useCallback } from "react";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type PeriodKey,
  PERIOD_KEYS,
  PERIOD_LABELS,
  formatRange,
  fromDateKey,
  rangeForPeriod,
  toDateKey,
} from "@/lib/dates";
import { shiftPeriod } from "@/lib/period-nav";

interface PeriodPickerProps {
  period: PeriodKey;
  reference: string;
}

/** Selector de periodo + navegación temporal, sincronizado con la URL. */
export function PeriodPicker({ period, reference }: PeriodPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) params.set(key, value);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const referenceDate = fromDateKey(reference);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <Tabs
        value={period}
        onValueChange={(value) => setParams({ periodo: value })}
      >
        <TabsList>
          {PERIOD_KEYS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {PERIOD_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Periodo anterior"
          onClick={() =>
            setParams({ fecha: toDateKey(shiftPeriod(period, referenceDate, -1)) })
          }
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Periodo siguiente"
          onClick={() =>
            setParams({ fecha: toDateKey(shiftPeriod(period, referenceDate, 1)) })
          }
        >
          <ChevronRight />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Volver a hoy"
          onClick={() => setParams({ fecha: toDateKey(new Date()) })}
        >
          <RotateCcw />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {formatRange(rangeForPeriod(period, referenceDate))}
      </p>
    </div>
  );
}
