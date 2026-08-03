"use client";

import { useState, useTransition } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createBudget, updateBudget } from "@/app/(app)/presupuestos/actions";
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
import { BUDGET_PERIODS, BUDGET_PERIOD_LABELS } from "@/lib/constants";
import type { CategoryOption } from "@/lib/queries/categories";
import type { BudgetRow } from "@/lib/queries/budgets";
import type { BudgetPeriod } from "@/types/database";

interface BudgetFormDialogProps {
  categories: CategoryOption[];
  budget?: BudgetRow;
  trigger?: React.ReactNode;
}

export function BudgetFormDialog({
  categories,
  budget,
  trigger,
}: BudgetFormDialogProps) {
  const isEdit = budget !== undefined;

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState<string>(
    budget?.categoryId ?? categories[0]?.id ?? "",
  );
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period ?? "mensual");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("category_id", categoryId);
    formData.set("period", period);

    startTransition(async () => {
      const result = isEdit
        ? await updateBudget(budget.id, formData)
        : await createBudget(formData);

      if (result.ok) {
        toast.success(isEdit ? "Presupuesto actualizado" : "Presupuesto creado");
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
          setCategoryId(budget?.categoryId ?? categories[0]?.id ?? "");
          setPeriod(budget?.period ?? "mensual");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus />
            Nuevo presupuesto
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar presupuesto" : "Nuevo presupuesto"}
          </DialogTitle>
          <DialogDescription>
            El gasto de una categoría incluye el de sus subcategorías.
          </DialogDescription>
        </DialogHeader>

        {categories.length === 0 ? (
          <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            Crea al menos una categoría antes de definir presupuestos.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget-category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="budget-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.emoji ? `${category.emoji} ` : ""}
                      {category.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget-period">Periodo</Label>
                <Select
                  value={period}
                  onValueChange={(value) => setPeriod(value as BudgetPeriod)}
                >
                  <SelectTrigger id="budget-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_PERIODS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {BUDGET_PERIOD_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit_amount">Límite</Label>
                <Input
                  id="limit_amount"
                  name="limit_amount"
                  type="text"
                  inputMode="decimal"
                  defaultValue={budget?.limitAmount ?? ""}
                  placeholder="0.00"
                  className="tabular"
                  required
                />
              </div>
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
              <Button type="submit" disabled={pending || !categoryId}>
                {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
