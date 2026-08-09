"use client";

import { useState, useTransition } from "react";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions";

interface ConfirmDeleteProps {
  title: string;
  description: string;
  onConfirm: () => Promise<ActionResult>;
  successMessage: string;
  trigger?: React.ReactNode;
}

/** Diálogo de confirmación reutilizable para cualquier borrado. */
export function ConfirmDelete({
  title,
  description,
  onConfirm,
  successMessage,
  trigger,
}: ConfirmDeleteProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm(event: React.MouseEvent) {
    // Se cierra manualmente al terminar para que el usuario vea el estado.
    event.preventDefault();
    startTransition(async () => {
      const result = await onConfirm();
      if (result.ok) {
        toast.success(successMessage);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon-sm" aria-label="Eliminar">
            <Trash2 className="text-negative-fg" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            {pending ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
