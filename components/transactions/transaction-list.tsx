"use client";

import { Pencil, Receipt, Repeat } from "lucide-react";

import { deleteTransaction } from "@/app/(app)/transacciones/actions";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateShort, fromDateKey } from "@/lib/dates";
import { formatMoney, toMoney } from "@/lib/money";
import type { AccountOption } from "@/lib/queries/accounts";
import type { CategoryOption } from "@/lib/queries/categories";
import type { TransactionRow } from "@/lib/queries/transactions";
import { cn } from "@/lib/utils";

interface TransactionListProps {
  transactions: TransactionRow[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  /** Oculta las acciones de edición (p.ej. dentro del calendario). */
  readOnly?: boolean;
  emptyDescription?: string;
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  readOnly = false,
  emptyDescription,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Sin movimientos"
        description={
          emptyDescription ??
          "No hay transacciones que coincidan con los filtros seleccionados."
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead className="hidden sm:table-cell">Cuenta</TableHead>
          <TableHead className="hidden md:table-cell">Nota</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          {!readOnly ? <TableHead className="w-20" /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const amount = toMoney(transaction.amount);
          const isIncome = transaction.type === "ingreso";

          return (
            <TableRow key={transaction.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDateShort(fromDateKey(transaction.date))}
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm"
                    style={{
                      backgroundColor: `${transaction.categoryColor ?? "#64748b"}22`,
                    }}
                  >
                    {transaction.categoryEmoji ?? "•"}
                  </span>
                  <span className="truncate">
                    {transaction.categoryName ?? (
                      <span className="text-muted-foreground">Sin categoría</span>
                    )}
                  </span>
                  {transaction.isRecurring ? (
                    <Repeat
                      className="h-3.5 w-3.5 shrink-0 text-info"
                      aria-label="Recurrente"
                    />
                  ) : null}
                </div>
              </TableCell>

              <TableCell className="hidden truncate text-muted-foreground sm:table-cell">
                {transaction.accountName}
              </TableCell>

              <TableCell className="hidden max-w-[16rem] md:table-cell">
                <span className="line-clamp-1 text-muted-foreground">
                  {transaction.note ?? "—"}
                </span>
              </TableCell>

              <TableCell className="text-right">
                <span
                  className={cn(
                    "tabular font-semibold",
                    isIncome ? "text-positive" : "text-negative",
                  )}
                >
                  {isIncome ? "+" : "−"}
                  {formatMoney(amount, transaction.accountCurrency)}
                </span>
              </TableCell>

              {!readOnly ? (
                <TableCell>
                  <div className="flex items-center justify-end">
                    <TransactionFormDialog
                      accounts={accounts}
                      categories={categories}
                      transaction={transaction}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Editar transacción"
                        >
                          <Pencil />
                        </Button>
                      }
                    />
                    <ConfirmDelete
                      title="Eliminar transacción"
                      description="Se recalcularán los saldos de la cuenta. Esta acción no se puede deshacer."
                      successMessage="Transacción eliminada"
                      onConfirm={() => deleteTransaction(transaction.id)}
                    />
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Resumen de ingresos, gastos y neto de un conjunto de transacciones. */
export function TransactionTotals({
  transactions,
  currency = "DOP",
}: {
  transactions: TransactionRow[];
  currency?: string;
}) {
  let ingresos = 0n;
  let gastos = 0n;

  for (const transaction of transactions) {
    const amount = toMoney(transaction.amount);
    if (transaction.type === "ingreso") ingresos += amount;
    else gastos += amount;
  }

  const neto = ingresos - gastos;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Totals label="Ingresos" value={formatMoney(ingresos, currency)} tone="positive" />
      <Totals label="Gastos" value={formatMoney(gastos, currency)} tone="negative" />
      <Totals
        label="Balance neto"
        value={formatMoney(neto, currency)}
        tone={neto < 0n ? "negative" : "positive"}
      />
    </div>
  );
}

function Totals({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "tabular text-lg font-bold",
          tone === "positive" ? "text-positive" : "text-negative",
        )}
      >
        {value}
      </p>
    </div>
  );
}
