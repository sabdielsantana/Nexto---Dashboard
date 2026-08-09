"use client";

import { useEffect, useState, useTransition } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createTransaction,
  updateTransaction,
} from "@/app/(app)/transacciones/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toDateKey } from "@/lib/dates";
import type { AccountOption } from "@/lib/queries/accounts";
import type { CategoryOption } from "@/lib/queries/categories";
import type { TransactionRow } from "@/lib/queries/transactions";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/types/database";

const NO_CATEGORY = "none";

interface TransactionFormDialogProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
  transaction?: TransactionRow;
  /** Fecha inicial al crear — la usa el calendario. */
  defaultDate?: string;
  /** Abre el diálogo al montar (deep link `?nueva=1`). */
  defaultOpen?: boolean;
  onOpenChangeExternal?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function TransactionFormDialog({
  accounts,
  categories,
  transaction,
  defaultDate,
  defaultOpen = false,
  onOpenChangeExternal,
  trigger,
}: TransactionFormDialogProps) {
  const isEdit = transaction !== undefined;
  const noAccounts = accounts.length === 0;

  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();

  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "gasto",
  );
  const [accountId, setAccountId] = useState<string>(
    transaction?.accountId ?? accounts[0]?.id ?? "",
  );
  const [categoryId, setCategoryId] = useState<string>(
    transaction?.categoryId ?? NO_CATEGORY,
  );

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  function resetState() {
    setType(transaction?.type ?? "gasto");
    setAccountId(transaction?.accountId ?? accounts[0]?.id ?? "");
    setCategoryId(transaction?.categoryId ?? NO_CATEGORY);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    onOpenChangeExternal?.(next);
    if (next) resetState();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("type", type);
    formData.set("account_id", accountId);
    formData.set("category_id", categoryId);

    startTransition(async () => {
      const result = isEdit
        ? await updateTransaction(transaction.id, formData)
        : await createTransaction(formData);

      if (result.ok) {
        toast.success(isEdit ? "Transacción actualizada" : "Transacción guardada");
        handleOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus />
            Nueva transacción
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar transacción" : "Nueva transacción"}
          </DialogTitle>
          <DialogDescription>
            El monto se guarda siempre en positivo; el tipo define si suma o resta.
          </DialogDescription>
        </DialogHeader>

        {noAccounts ? (
          <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning-fg">
            Necesitas crear al menos una cuenta antes de registrar transacciones.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de tipo con color semántico */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("ingreso")}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                  type === "ingreso"
                    ? "border-positive bg-positive/15 text-positive-fg"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setType("gasto")}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                  type === "gasto"
                    ? "border-negative bg-negative/15 text-negative-fg"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                Gasto
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  defaultValue={transaction?.amount ?? ""}
                  placeholder="0.00"
                  className="tabular"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={
                    transaction?.date ?? defaultDate ?? toDateKey(new Date())
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Cuenta</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="account">
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} · {account.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>Sin categoría</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.emoji ? `${category.emoji} ` : ""}
                      {category.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Nota</Label>
              <Textarea
                id="note"
                name="note"
                defaultValue={transaction?.note ?? ""}
                placeholder="Detalle del movimiento (opcional)"
                rows={3}
                maxLength={500}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_recurring"
                defaultChecked={transaction?.isRecurring ?? false}
                className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
              />
              Es un movimiento recurrente
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || !accountId}>
                {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
