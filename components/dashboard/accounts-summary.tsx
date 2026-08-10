"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowRight, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DistributionBar,
  type DistributionSegment,
} from "@/components/ui/distribution-bar";
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { ZERO, formatMoney, toMoney, toNumber } from "@/lib/money";
import type { AccountWithBalance } from "@/lib/queries/accounts";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/types/database";

// Rangos del selector de periodo. De momento es solo un control visual: no
// refiltra los datos (el total mostrado es el patrimonio actual). El cableado
// real contra `balance_evolution` queda para una fase posterior.
const PATRIMONIO_PERIODS = ["1W", "1M", "6M", "1Y", "Todo"] as const;
type PatrimonioPeriod = (typeof PATRIMONIO_PERIODS)[number];

/**
 * Patrimonio total y reparto por tipo de cuenta.
 *
 * Nota: los saldos se suman tal cual entre monedas distintas — no hay tasas de
 * cambio en el modelo de datos. Con cuentas en varias monedas el total es
 * orientativo.
 */
export function AccountsSummary({
  accounts,
}: {
  accounts: AccountWithBalance[];
}) {
  const [period, setPeriod] = useState<PatrimonioPeriod>("1M");

  let total = ZERO;
  const porTipo = new Map<AccountType, number>();

  for (const account of accounts) {
    const saldo = toMoney(account.saldoActual);
    total += saldo;
    if (saldo > ZERO) {
      porTipo.set(
        account.type,
        (porTipo.get(account.type) ?? 0) + toNumber(saldo),
      );
    }
  }

  const segments: DistributionSegment[] = [...porTipo.entries()].map(
    ([type, value]) => ({
      label: ACCOUNT_TYPE_LABELS[type],
      color: ACCOUNT_TYPE_COLORS[type],
      value,
    }),
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4" />
          Patrimonio
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/cuentas">
            Ver cuentas
            <ArrowRight />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p
            className={cn(
              "tabular text-3xl font-bold",
              total < ZERO ? "text-negative-fg" : "text-foreground",
            )}
          >
            {formatMoney(total)}
          </p>

          {/* Selector de periodo (pill). Visual por ahora — ver nota arriba. */}
          <div
            role="tablist"
            aria-label="Periodo del patrimonio"
            className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5"
          >
            {PATRIMONIO_PERIODS.map((option) => {
              const active = option === period;
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPeriod(option)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <DistributionBar segments={segments} />
      </CardContent>
    </Card>
  );
}
