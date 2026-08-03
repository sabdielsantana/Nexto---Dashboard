"use client";

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
        <p
          className={cn(
            "tabular text-3xl font-bold",
            total < ZERO ? "text-negative" : "text-foreground",
          )}
        >
          {formatMoney(total)}
        </p>

        <DistributionBar segments={segments} />
      </CardContent>
    </Card>
  );
}
