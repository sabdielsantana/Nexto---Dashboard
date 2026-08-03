"use client";

/**
 * Tokens compartidos por los gráficos de Recharts.
 * Se resuelven contra las variables CSS para que respondan al tema activo.
 */
export const CHART_COLORS = {
  positive: "hsl(var(--positive))",
  negative: "hsl(var(--negative))",
  info: "hsl(var(--info))",
  warning: "hsl(var(--warning))",
  accent: "hsl(var(--accent-alt))",
  grid: "hsl(var(--border))",
  axis: "hsl(var(--muted-foreground))",
} as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    fontSize: "0.8rem",
    color: "hsl(var(--popover-foreground))",
  },
  labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600 },
  itemStyle: { color: "hsl(var(--popover-foreground))" },
} as const;

export const AXIS_PROPS = {
  stroke: CHART_COLORS.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;
