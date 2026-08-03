"use client";

import { useState, useTransition } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createAccount, updateAccount } from "@/app/(app)/cuentas/actions";
import type { AccountWithBalance } from "@/lib/queries/accounts";
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
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, CURRENCIES } from "@/lib/constants";
import type { AccountType } from "@/types/database";

interface AccountFormDialogProps {
  /** Si viene, el diálogo edita esa cuenta; si no, crea una nueva. */
  account?: AccountWithBalance;
  trigger?: React.ReactNode;
}

export function AccountFormDialog({ account, trigger }: AccountFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<AccountType>(account?.type ?? "debito");
  const [currency, setCurrency] = useState<string>(account?.currency ?? "DOP");

  const isEdit = account !== undefined;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("type", type);
    formData.set("currency", currency);

    startTransition(async () => {
      const result = isEdit
        ? await updateAccount(account.id, formData)
        : await createAccount(formData);

      if (result.ok) {
        toast.success(isEdit ? "Cuenta actualizada" : "Cuenta creada");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // Reinicia los selects controlados al abrir.
          setType(account?.type ?? "debito");
          setCurrency(account?.currency ?? "DOP");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus />
            Nueva cuenta
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cuenta" : "Nueva cuenta"}</DialogTitle>
          <DialogDescription>
            El saldo base es el punto de partida. El saldo mostrado en la app se
            calcula sumando ingresos y restando gastos sobre esa base.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={account?.name ?? ""}
              placeholder="Cuenta de ahorros"
              required
              maxLength={80}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as AccountType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ACCOUNT_TYPE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Institución (opcional)</Label>
            <Input
              id="institution"
              name="institution"
              defaultValue={account?.institution ?? ""}
              placeholder="Banco Popular"
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Saldo base</Label>
            <Input
              id="balance"
              name="balance"
              type="text"
              inputMode="decimal"
              defaultValue={account?.saldoBase ?? "0.00"}
              placeholder="0.00"
              className="tabular"
            />
            <p className="text-xs text-muted-foreground">
              Puede ser negativo, por ejemplo en una tarjeta de crédito con deuda.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear cuenta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
