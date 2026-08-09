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
import { formatDateCompact, formatDateShort, fromDateKey } from "@/lib/dates";
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
  /**
   * Oculta la columna de fecha. Para contextos donde todas las filas son del
   * mismo día — el panel del calendario — donde repetirla no aporta y en una
   * tarjeta angosta le roba ancho a la categoría.
   */
  hideDate?: boolean;
  emptyDescription?: string;
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  readOnly = false,
  hideDate = false,
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
    /*
     * `@container` mide el ancho de ESTA tarjeta, no el del viewport. Es lo que
     * arregla el desbordamiento: la misma tabla vive en la página completa y en
     * tarjetas de ~22rem, y con breakpoints de viewport se pintaban todas las
     * columnas también en las estrechas, empujando el monto fuera de vista.
     *
     * Ojo: los cortes de container no son los del viewport. Aquí @md = 28rem y
     * @2xl = 42rem, medidos contra la tarjeta.
     */
    <div className="@container [&_td]:px-2 [&_th]:px-2 @md:[&_td]:px-3 @md:[&_th]:px-3">
      <Table>
        {/*
          En tarjetas compactas la cabecera se oculta: la palabra "Categoría"
          fija un ancho mínimo de 95px cuando la celda solo necesita ~52, y ese
          exceso es lo que empujaba el monto fuera. A ese tamaño la lista se lee
          sola (fecha · categoría · monto).
        */}
        <TableHeader className="hidden @md:table-header-group">
          <TableRow>
            {!hideDate ? <TableHead>Fecha</TableHead> : null}
            <TableHead>Categoría</TableHead>
            <TableHead className="hidden @md:table-cell">Cuenta</TableHead>
            <TableHead className="hidden @2xl:table-cell">Nota</TableHead>
            {/* El monto nunca se oculta: es el dato que se viene a leer. */}
            <TableHead className="text-right">Monto</TableHead>
            {!readOnly ? <TableHead className="w-16" /> : null}
          </TableRow>
        </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const amount = toMoney(transaction.amount);
          const isIncome = transaction.type === "ingreso";

          return (
            <TableRow key={transaction.id}>
              {/* Sin año cuando la tarjeta es angosta: libera ~30px para la
                  categoría sin perder el dato. */}
              {!hideDate ? (
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  <span className="@sm:hidden">
                    {formatDateCompact(fromDateKey(transaction.date))}
                  </span>
                  <span className="hidden @sm:inline">
                    {formatDateShort(fromDateKey(transaction.date))}
                  </span>
                </TableCell>
              ) : null}

              {/*
                `w-full max-w-0` convierte a categoría en la columna elástica:
                absorbe el espacio sobrante y es la única que se recorta. Sin
                esto, `table-layout: auto` le da su ancho de contenido mínimo y
                empuja el monto fuera del contenedor.
              */}
              <TableCell className="w-full max-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm"
                    style={{
                      backgroundColor: `${transaction.categoryColor ?? "#64748b"}22`,
                    }}
                  >
                    {transaction.categoryEmoji ?? "•"}
                  </span>
                  <span className="min-w-0 truncate">
                    {transaction.categoryName ?? (
                      <span className="text-muted-foreground">Sin categoría</span>
                    )}
                  </span>
                  {transaction.isRecurring ? (
                    <Repeat
                      className="h-3.5 w-3.5 shrink-0 text-info-fg"
                      aria-label="Recurrente"
                    />
                  ) : null}
                </div>
              </TableCell>

              <TableCell className="hidden truncate text-muted-foreground @md:table-cell">
                {transaction.accountName}
              </TableCell>

              <TableCell className="hidden max-w-[16rem] @2xl:table-cell">
                <span className="line-clamp-1 text-muted-foreground">
                  {transaction.note ?? "—"}
                </span>
              </TableCell>

              <TableCell className="whitespace-nowrap text-right">
                <span
                  className={cn(
                    "tabular font-semibold",
                    isIncome ? "text-positive-fg" : "text-negative-fg",
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
    </div>
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
          tone === "positive" ? "text-positive-fg" : "text-negative-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}
