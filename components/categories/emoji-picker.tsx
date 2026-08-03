"use client";

import { useState } from "react";

import { Smile, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CATEGORY_EMOJIS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string | null) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-14 text-xl"
            aria-label="Elegir emoji"
          >
            {value ?? <Smile className="text-muted-foreground" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="grid grid-cols-8 gap-1">
            {CATEGORY_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded text-lg transition-colors hover:bg-accent",
                  value === emoji && "bg-primary/20 ring-1 ring-primary",
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(null)}
          aria-label="Quitar emoji"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
