"use client";

import { useCallback } from "react";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { AccountOption } from "@/lib/queries/accounts";
import type { CategoryOption } from "@/lib/queries/categories";
import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { shiftPeriod } from "@/lib/period-nav";

const ALL = "all";

interface TransactionFiltersProps {
  period: PeriodKey;
  reference: string;
  accountId: string | undefined;
  categoryId: string | undefined;
  type: string | undefined;
  accounts: AccountOption[];
  categories: CategoryOption[];
}

export function TransactionFilters({
  period,
  reference,
  accountId,
  categoryId,
  type,
  accounts,
  categories,
}: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Reescribe la URL: los filtros viven en la query string. */
  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === ALL) params.delete(key);
        else params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const referenceDate = fromDateKey(reference);
  const range = rangeForPeriod(period, referenceDate);

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
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
              setParams({
                fecha: toDateKey(shiftPeriod(period, referenceDate, -1)),
              })
            }
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Periodo siguiente"
            onClick={() =>
              setParams({
                fecha: toDateKey(shiftPeriod(period, referenceDate, 1)),
              })
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

        <p className="text-sm text-muted-foreground">{formatRange(range)}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          value={accountId ?? ALL}
          onValueChange={(value) => setParams({ cuenta: value })}
        >
          <SelectTrigger aria-label="Filtrar por cuenta">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las cuentas</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryId ?? ALL}
          onValueChange={(value) => setParams({ categoria: value })}
        >
          <SelectTrigger aria-label="Filtrar por categoría">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.emoji ? `${category.emoji} ` : ""}
                {category.path}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={type ?? ALL}
          onValueChange={(value) => setParams({ tipo: value })}
        >
          <SelectTrigger aria-label="Filtrar por tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Ingresos y gastos</SelectItem>
            <SelectItem value="ingreso">
              {TRANSACTION_TYPE_LABELS.ingreso}
            </SelectItem>
            <SelectItem value="gasto">
              {TRANSACTION_TYPE_LABELS.gasto}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
