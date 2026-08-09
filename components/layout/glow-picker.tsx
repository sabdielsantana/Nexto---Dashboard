"use client";

import { useState, useTransition } from "react";

import { Check, Palette } from "lucide-react";
import { toast } from "sonner";

import { setGlow } from "@/app/(app)/preferences-actions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { readableInkOn } from "@/lib/color";
import { GLOW_COLORS, GLOW_LABELS, GLOW_HUES, glowSwatch } from "@/lib/glow";
import { cn } from "@/lib/utils";
import type { GlowColor } from "@/types/database";

/** Selector de ambiente: el color del glow de fondo, persistido por usuario. */
export function GlowPicker({ current }: { current: GlowColor }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(current);

  function choose(color: GlowColor) {
    setOptimistic(color);
    startTransition(async () => {
      const result = await setGlow(color);
      if (result.ok) {
        toast.success(`Ambiente: ${GLOW_LABELS[color]}`);
        setOpen(false);
      } else {
        setOptimistic(current);
        toast.error(result.error);
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" aria-label="Cambiar ambiente">
          <span
            className="h-3 w-3 shrink-0 rounded-full border border-border"
            style={{ backgroundColor: glowSwatch(optimistic) }}
          />
          <span className="hidden sm:inline">Ambiente</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-56">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Palette className="h-4 w-4" />
          Ambiente del fondo
        </p>

        <div className="grid grid-cols-3 gap-2">
          {GLOW_COLORS.map((color) => {
            const selected = optimistic === color;
            const hue = GLOW_HUES[color];
            return (
              <button
                key={color}
                type="button"
                disabled={pending}
                onClick={() => choose(color)}
                aria-pressed={selected}
                title={GLOW_LABELS[color]}
                className={cn(
                  "flex h-12 items-center justify-center rounded-md border border-border transition-transform hover:scale-105 disabled:opacity-50",
                  selected && "ring-2 ring-ring ring-offset-1 ring-offset-background",
                )}
                style={{ backgroundColor: glowSwatch(color) }}
              >
                {selected ? (
                  <Check
                    className="h-4 w-4"
                    /* Tinta elegida por contraste sobre el color de la muestra. */
                    style={{ color: hue ? readableInkOn(hslToHex(hue)) : undefined }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Se guarda en tu cuenta y te sigue entre dispositivos.
        </p>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Convierte el triplete HSL de un ambiente a hex, que es lo que espera
 * `readableInkOn`. Solo se usa para decidir el color del check.
 */
function hslToHex(triplet: string): string {
  const [h, s, l] = triplet
    .split(/\s+/)
    .map((part) => Number.parseFloat(part.replace("%", "")));

  const hue = h ?? 0;
  const sat = (s ?? 0) / 100;
  const lig = (l ?? 0) / 100;

  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;

  const [r, g, b] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];

  const to255 = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${to255(r ?? 0)}${to255(g ?? 0)}${to255(b ?? 0)}`;
}
