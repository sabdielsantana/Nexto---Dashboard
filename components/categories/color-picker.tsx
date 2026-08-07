"use client";

import { Check } from "lucide-react";

import { readableInkOn } from "@/lib/color";
import { CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((color) => {
        const selected = value?.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Color ${color}`}
            aria-pressed={selected}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110",
              selected && "ring-2 ring-foreground",
            )}
            style={{ backgroundColor: color }}
          >
            {/*
              El fondo lo elige la persona usuaria, así que el color del check
              se decide en tiempo de ejecución por contraste. Con `text-white`
              fijo, sobre el amarillo o el verde de la paleta el ratio caía a
              1.92:1 y el check era prácticamente invisible.
            */}
            {selected ? (
              <Check
                className="h-3.5 w-3.5"
                style={{ color: readableInkOn(color) }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
