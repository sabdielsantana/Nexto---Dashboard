"use client";

import { Landmark, Pencil, Wallet } from "lucide-react";

import { deleteAccount } from "@/app/(app)/cuentas/actions";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import {
  DistributionBar,
  type DistributionSegment,
} from "@/components/ui/distribution-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { ZERO, formatMoney, toMoney, toNumber } from "@/lib/money";
import type { AccountWithBalance } from "@/lib/queries/accounts";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/types/database";

interface AccountsViewProps {
  accounts: AccountWithBalance[];
}

export function AccountsView({ accounts }: AccountsViewProps) {
  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Todavía no tienes cuentas"
        description="Crea tu primera cuenta para empezar a registrar movimientos."
        action={<AccountFormDialog />}
      />
    );
  }

  // La distribución de activos solo considera saldos positivos: una cuenta en
  // rojo es un pasivo y distorsionaría los porcentajes.
  const porTipo = new Map<AccountType, number>();
  for (const account of accounts) {
    const saldo = toMoney(account.saldoActual);
    if (saldo <= ZERO) continue;
    porTipo.set(account.type, (porTipo.get(account.type) ?? 0) + toNumber(saldo));
  }

  const segments: DistributionSegment[] = [...porTipo.entries()].map(
    ([type, value]) => ({
      label: ACCOUNT_TYPE_LABELS[type],
      color: ACCOUNT_TYPE_COLORS[type],
      value,
    }),
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Distribución de activos</CardTitle>
        </CardHeader>
        <CardContent>
          <DistributionBar segments={segments} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}

function AccountCard({ account }: { account: AccountWithBalance }) {
  const saldo = toMoney(account.saldoActual);
  const negativo = saldo < ZERO;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{account.name}</CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              style={{
                borderColor: `${ACCOUNT_TYPE_COLORS[account.type]}55`,
                color: ACCOUNT_TYPE_COLORS[account.type],
              }}
            >
              {ACCOUNT_TYPE_LABELS[account.type]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {account.currency}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <AccountFormDialog
            account={account}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Editar cuenta">
                <Pencil />
              </Button>
            }
          />
          <ConfirmDelete
            title={`Eliminar "${account.name}"`}
            description="Se eliminarán también todas las transacciones asociadas a esta cuenta. Esta acción no se puede deshacer."
            successMessage="Cuenta eliminada"
            onConfirm={() => deleteAccount(account.id)}
          />
        </div>
      </CardHeader>

      <CardContent className="mt-auto space-y-1">
        <p className="text-xs text-muted-foreground">Saldo actual</p>
        <p
          className={cn(
            "tabular text-2xl font-bold",
            negativo ? "text-negative-fg" : "text-positive-fg",
          )}
        >
          {formatMoney(saldo, account.currency)}
        </p>
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span>
            Base: {formatMoney(toMoney(account.saldoBase), account.currency)}
          </span>
          {account.institution ? (
            <span className="flex items-center gap-1 truncate">
              <Landmark className="h-3 w-3 shrink-0" />
              {account.institution}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
