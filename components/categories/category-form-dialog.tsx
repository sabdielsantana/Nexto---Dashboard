"use client";

import { useState, useTransition } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createCategory, updateCategory } from "@/app/(app)/categorias/actions";
import { ColorPicker } from "@/components/categories/color-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_COLORS } from "@/lib/constants";
import type { CategoryOption } from "@/lib/queries/categories";

const ROOT_VALUE = "none";

interface CategoryFormDialogProps {
  category?: CategoryOption;
  /** Categorías disponibles como padre. */
  options: CategoryOption[];
  /** Preselecciona un padre — usado por "añadir subcategoría". */
  defaultParentId?: string;
  trigger?: React.ReactNode;
}

export function CategoryFormDialog({
  category,
  options,
  defaultParentId,
  trigger,
}: CategoryFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [emoji, setEmoji] = useState<string | null>(category?.emoji ?? null);
  const [color, setColor] = useState<string | null>(
    category?.color ?? CATEGORY_COLORS[0],
  );
  const [parentId, setParentId] = useState<string>(
    category?.parentId ?? defaultParentId ?? ROOT_VALUE,
  );

  const isEdit = category !== undefined;

  // Una categoría no puede ser su propio padre ni el de sus descendientes.
  const parentOptions = options.filter((option) => {
    if (!category) return true;
    if (option.id === category.id) return false;
    return !option.path.startsWith(`${category.path} › `);
  });

  function resetState() {
    setEmoji(category?.emoji ?? null);
    setColor(category?.color ?? CATEGORY_COLORS[0]);
    setParentId(category?.parentId ?? defaultParentId ?? ROOT_VALUE);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("emoji", emoji ?? "");
    formData.set("color", color ?? "");
    formData.set("parent_category_id", parentId);

    startTransition(async () => {
      const result = isEdit
        ? await updateCategory(category.id, formData)
        : await createCategory(formData);

      if (result.ok) {
        toast.success(isEdit ? "Categoría actualizada" : "Categoría creada");
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
        if (next) resetState();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus />
            Nueva categoría
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
          <DialogDescription>
            Elige un emoji y un color para reconocerla de un vistazo en gráficos
            y listados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="space-y-2">
              <Label>Emoji</Label>
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                defaultValue={category?.name ?? ""}
                placeholder="Comida"
                required
                maxLength={60}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Categoría padre</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger id="parent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT_VALUE}>
                  Ninguna (categoría principal)
                </SelectItem>
                {parentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.emoji ? `${option.emoji} ` : ""}
                    {option.path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {pending
                ? "Guardando…"
                : isEdit
                  ? "Guardar cambios"
                  : "Crear categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
