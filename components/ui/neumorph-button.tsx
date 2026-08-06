"use client";

import * as React from "react";

import { type VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { type HTMLMotionProps, motion } from "motion/react";

import { cn } from "@/lib/utils";

/*
 * Botón neumórfico de cult-ui, adaptado al sistema de diseño del proyecto.
 *
 * El original traía los colores en hex fijos (#36322F, #2C7BE5, …), así que no
 * reaccionaba al toggle claro/oscuro. Aquí cada intención se ata a un token
 * semántico y el relieve se compone con opacidad sobre ese mismo token —
 * `hsl(var(--token) / X)`, el mismo patrón que la rampa del heatmap.
 *
 * El relieve vive en las clases base y se tiñe con `--nb-accent`, que cada
 * intención declara. Dos motivos:
 *   1. Las clases quedan literales. Tailwind escanea el código como texto
 *      plano, así que una clase construida con plantillas (`shadow-[...${x}]`)
 *      nunca se generaría y el botón saldría sin relieve.
 *   2. El relieve queda definido en un solo sitio en vez de repetirse por
 *      intención.
 *
 * `secondary` sí sobrescribe las sombras: al no tener tinte, un halo de color
 * no le aporta. cn() (tailwind-merge) resuelve el conflicto a favor de la
 * variante porque llega después que la base.
 */
const neumorphButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-medium",
    "transition-[box-shadow,background-color] active:transition-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "disabled:bg-muted disabled:text-muted-foreground",
    "[&_svg]:shrink-0",
    // Relieve: borde inferior hundido (negro translúcido, sirve en ambos
    // temas) + halo exterior teñido con la intención.
    "shadow-[inset_0_-2.1px_0_0_hsl(0_0%_0%/0.30),0_1.2px_6.3px_0_hsl(var(--nb-accent)/0.45)]",
    "hover:enabled:shadow-[inset_0_-2.5px_0_0_hsl(0_0%_0%/0.34),0_1.45px_7.6px_0_hsl(var(--nb-accent)/0.55)]",
    "active:shadow-[inset_0_-1.5px_0_0_hsl(0_0%_0%/0.36),0_0.5px_2px_0_hsl(var(--nb-accent)/0.6)]",
    "disabled:shadow-none",
  ].join(" "),
  {
    variants: {
      intent: {
        /** Acento principal de la app (púrpura). */
        default:
          "bg-primary text-primary-foreground hover:enabled:bg-primary/90 active:bg-primary/80 [--nb-accent:var(--primary)]",
        /** Azul = información / neutral. */
        info: "bg-info text-white hover:enabled:bg-info/90 active:bg-info/80 [--nb-accent:var(--info)]",
        /**
         * Verde = superávit / confirmación. Lleva tinta oscura: el blanco
         * sobre este verde no alcanza el contraste mínimo (ver --on-bright).
         */
        positive:
          "bg-positive text-on-bright hover:enabled:bg-positive/90 active:bg-positive/80 [--nb-accent:var(--positive)]",
        /** Rojo = déficit / acción destructiva. */
        negative:
          "bg-negative text-white hover:enabled:bg-negative/90 active:bg-negative/80 [--nb-accent:var(--negative)]",
        /** Naranja = alerta / pendiente. Misma razón que positive. */
        warning:
          "bg-warning text-on-bright hover:enabled:bg-warning/90 active:bg-warning/80 [--nb-accent:var(--warning)]",
        /** Superficie neutra, sin halo de color. */
        secondary: [
          "border border-border bg-card text-card-foreground",
          "hover:enabled:bg-accent active:bg-accent",
          "shadow-[inset_0_-2.1px_0_0_hsl(0_0%_0%/0.14),0_1.2px_5px_0_hsl(0_0%_0%/0.10)]",
          "hover:enabled:shadow-[inset_0_-2.5px_0_0_hsl(0_0%_0%/0.16),0_1.45px_6px_0_hsl(0_0%_0%/0.12)]",
          "active:shadow-[inset_0_-1.5px_0_0_hsl(0_0%_0%/0.18),0_0.5px_2px_0_hsl(0_0%_0%/0.14)]",
        ].join(" "),
      },
      size: {
        small: "h-9 rounded-[8px] px-2 py-1 text-xs [&_svg]:size-3.5",
        medium: "h-11 rounded-[9px] px-4 py-2 text-base [&_svg]:size-4",
        large: "h-14 rounded-[11px] px-6 py-3 text-lg [&_svg]:size-5",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      intent: "default",
      size: "medium",
    },
  },
);

export interface NeumorphButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof neumorphButtonVariants> {
  children: React.ReactNode;
  loading?: boolean;
}

const NeumorphButton = React.forwardRef<HTMLButtonElement, NeumorphButtonProps>(
  (
    {
      className,
      intent,
      size,
      fullWidth,
      children,
      loading = false,
      disabled,
      ...props
    },
    ref,
  ) => (
    <motion.button
      ref={ref}
      className={cn(
        neumorphButtonVariants({ intent, size, fullWidth }),
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" /> : null}
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: loading ? 0.7 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
    </motion.button>
  ),
);
NeumorphButton.displayName = "NeumorphButton";

export { NeumorphButton, neumorphButtonVariants };
