"use client";

import { useState, useTransition } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createGoal, updateGoal } from "@/app/(app)/metas/actions";
import { EmojiPicker } from "@/components/categories/emoji-picker";
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
import type { GoalRow } from "@/lib/queries/goals";

interface GoalFormDialogProps {
  goal?: GoalRow;
  trigger?: React.ReactNode;
}

export function GoalFormDialog({ goal, trigger }: GoalFormDialogProps) {
  const isEdit = goal !== undefined;

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [emoji, setEmoji] = useState<string | null>(goal?.emoji ?? "🎯");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("emoji", emoji ?? "");

    startTransition(async () => {
      const result = isEdit
        ? await updateGoal(goal.id, formData)
        : await createGoal(formData);

      if (result.ok) {
        toast.success(isEdit ? "Meta actualizada" : "Meta creada");
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
        if (next) setEmoji(goal?.emoji ?? "🎯");
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus />
            Nueva meta
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar meta" : "Nueva meta"}</DialogTitle>
          <DialogDescription>
            Define cuánto quieres ahorrar y para cuándo. Calcularemos si vas a
            tiempo según tu ritmo actual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="space-y-2">
              <Label>Emoji</Label>
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="goal-name">Nombre</Label>
              <Input
                id="goal-name"
                name="name"
                defaultValue={goal?.name ?? ""}
                placeholder="Fondo de emergencia"
                required
                maxLength={80}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="target_amount">Monto objetivo</Label>
              <Input
                id="target_amount"
                name="target_amount"
                type="text"
                inputMode="decimal"
                defaultValue={goal?.targetAmount ?? ""}
                placeholder="0.00"
                className="tabular"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_amount">Ya ahorrado</Label>
              <Input
                id="current_amount"
                name="current_amount"
                type="text"
                inputMode="decimal"
                defaultValue={goal?.currentAmount ?? "0.00"}
                placeholder="0.00"
                className="tabular"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Fecha límite</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={goal?.deadline ?? ""}
              required
            />
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
              {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
