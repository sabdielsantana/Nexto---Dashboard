"use client";

import { cn } from "@/lib/utils";

export interface DistributionSegment {
  label: string;
  color: string;
  /** Peso relativo del segmento; se normaliza internamente. */
  value: number;
}

interface DistributionBarProps {
  segments: readonly DistributionSegment[];
  className?: string;
  showLegend?: boolean;
}

/**
 * Barra horizontal segmentada con leyenda de porcentajes.
 * Se usa para la distribución de activos por tipo de cuenta y para el reparto
 * de gasto por categoría.
 */
export function DistributionBar({
  segments,
  className,
  showLegend = true,
}: DistributionBarProps) {
  const total = segments.reduce((acc, segment) => acc + segment.value, 0);

  if (total <= 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="h-2.5 w-full rounded-full bg-muted" />
        <p className="text-xs text-muted-foreground">Sin datos para distribuir.</p>
      </div>
    );
  }

  const withPercent = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => ({
      ...segment,
      percent: (segment.value / total) * 100,
    }));

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {withPercent.map((segment) => (
          <div
            key={segment.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${segment.percent}%`,
              backgroundColor: segment.color,
            }}
            title={`${segment.label}: ${segment.percent.toFixed(1)}%`}
          />
        ))}
      </div>

      {showLegend ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {withPercent.map((segment) => (
            <li
              key={segment.label}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-foreground">{segment.label}</span>
              <span className="tabular">{segment.percent.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
