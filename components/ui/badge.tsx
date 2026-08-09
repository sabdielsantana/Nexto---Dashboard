import * as React from "react";

import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badges de estado del sistema de diseño:
 * pendiente=naranja, en progreso=azul, enviado=púrpura, en revisión=amarillo,
 * éxito=verde, fallido=rojo, expirado=gris.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        pendiente: "border-warning/30 bg-warning/15 text-warning-fg",
        progreso: "border-info/30 bg-info/15 text-info-fg",
        enviado: "border-accentAlt/30 bg-accentAlt/15 text-accentAlt",
        revision: "border-yellow-500/30 bg-yellow-500/15 text-yellow-500",
        exito: "border-positive/30 bg-positive/15 text-positive-fg",
        fallido: "border-negative/30 bg-negative/15 text-negative-fg",
        expirado: "border-muted-foreground/30 bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
