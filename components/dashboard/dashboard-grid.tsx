"use client";

// Estilos base de react-grid-layout (transiciones, placeholder, tiradores de
// resize). En 1.x el paquete trae los estilos de react-resizable incluidos, así
// que solo hace falta este import; el tema se ajusta en globals.css.
import "react-grid-layout/css/styles.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Check, GripVertical, LayoutGrid, RotateCcw } from "lucide-react";
import {
  Responsive,
  WidthProvider,
  type Layout,
  type Layouts,
} from "react-grid-layout";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ResponsiveGridLayout = WidthProvider(Responsive);

/** Un widget del panel: su id estable y el nodo ya renderizado en el servidor. */
export interface DashboardWidget {
  id: string;
  node: React.ReactNode;
}

/**
 * Especificación de tamaño por breakpoint de cada widget. El alto (`h`) es en
 * filas del grid; el ancho (`w`) en columnas del breakpoint. En xs/xxs todos
 * ocupan el ancho completo, así que ahí no se declara `w`.
 */
interface WidgetSpec {
  id: string;
  h: number;
  lg: number;
  md: number;
  sm: number;
}

// Orden y tamaños por defecto. Coincide con el orden en el que la página monta
// los widgets; el usuario puede reordenarlos arrastrando en modo edición.
const WIDGETS: readonly WidgetSpec[] = [
  { id: "kpi", h: 3, lg: 12, md: 10, sm: 6 },
  { id: "patrimonio", h: 4, lg: 12, md: 10, sm: 6 },
  { id: "budget-alerts", h: 4, lg: 12, md: 10, sm: 6 },
  { id: "daily-activity", h: 5, lg: 4, md: 4, sm: 6 },
  { id: "income-expense", h: 5, lg: 8, md: 6, sm: 6 },
  { id: "calendar", h: 4, lg: 12, md: 10, sm: 6 },
  { id: "spending", h: 6, lg: 6, md: 5, sm: 6 },
  { id: "goals", h: 4, lg: 6, md: 5, sm: 6 },
  { id: "transactions", h: 6, lg: 6, md: 5, sm: 6 },
];

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } as const;
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 } as const;
const BREAKPOINT_KEYS = ["lg", "md", "sm", "xs", "xxs"] as const;

const ROW_HEIGHT = 48;
const MARGIN: [number, number] = [16, 16];

const STORAGE_KEY = "nexto:dashboard-layout:v1";

/**
 * Rellena una fila de izquierda a derecha: cuando un widget no cabe en las
 * columnas que quedan, salta a la siguiente fila. La compactación vertical de
 * react-grid-layout termina de ordenar los huecos.
 */
function buildLayout(cols: number, widthOf: (spec: WidgetSpec) => number): Layout[] {
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  const items: Layout[] = [];

  for (const spec of WIDGETS) {
    const w = Math.min(widthOf(spec), cols);
    if (x + w > cols) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }
    items.push({
      i: spec.id,
      x,
      y,
      w,
      h: spec.h,
      minW: Math.min(2, cols),
      minH: 2,
    });
    x += w;
    rowHeight = Math.max(rowHeight, spec.h);
  }

  return items;
}

const DEFAULT_LAYOUTS: Layouts = {
  lg: buildLayout(COLS.lg, (s) => s.lg),
  md: buildLayout(COLS.md, (s) => s.md),
  sm: buildLayout(COLS.sm, (s) => s.sm),
  xs: buildLayout(COLS.xs, () => COLS.xs),
  xxs: buildLayout(COLS.xxs, () => COLS.xxs),
};

/**
 * Cruza la base con lo guardado en el navegador y con los widgets realmente
 * presentes. Así un layout guardado no reserva hueco para un widget que hoy no
 * se muestra (p.ej. las alertas de presupuesto cuando no hay ninguna), y un
 * widget nuevo cae en su posición por defecto en vez de quedar sin sitio.
 */
function reconcile(
  saved: Partial<Record<string, Layout[]>> | null,
  present: Set<string>,
): Layouts {
  const out: Layouts = {};
  for (const bp of BREAKPOINT_KEYS) {
    const baseArr = DEFAULT_LAYOUTS[bp] ?? [];
    const savedArr = saved?.[bp];
    out[bp] = baseArr
      .filter((item) => present.has(item.i))
      .map((item) => {
        const match = savedArr?.find((s) => s.i === item.i);
        return match
          ? { ...item, x: match.x, y: match.y, w: match.w, h: match.h }
          : item;
      });
  }
  return out;
}

function readSaved(): Partial<Record<string, Layout[]>> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Partial<Record<string, Layout[]>>)
      : null;
  } catch {
    return null;
  }
}

function persist(layouts: Layouts): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  } catch {
    // Cuota llena o almacenamiento deshabilitado: no es crítico, el panel
    // sigue funcionando con el layout en memoria.
  }
}

export function DashboardGrid({ widgets }: { widgets: DashboardWidget[] }) {
  const present = useMemo(
    () => new Set(widgets.map((w) => w.id)),
    [widgets],
  );

  const [layouts, setLayouts] = useState<Layouts>(() =>
    reconcile(null, present),
  );
  const [editing, setEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Ignora los onLayoutChange que dispara react-grid-layout al montar y al
  // compactar por primera vez: solo persistimos cambios hechos por el usuario.
  const hydrated = useRef(false);

  // La hidratación del layout guardado vive en un efecto para no leer
  // localStorage durante el render (evita desajustes servidor/cliente).
  useEffect(() => {
    setLayouts(reconcile(readSaved(), present));
    setMounted(true);
    hydrated.current = true;
  }, [present]);

  const handleLayoutChange = useCallback(
    (_current: Layout[], all: Layouts) => {
      setLayouts(all);
      if (hydrated.current) persist(all);
    },
    [],
  );

  const reset = useCallback(() => {
    const defaults = reconcile(null, present);
    setLayouts(defaults);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignorar
      }
    }
  }, [present]);

  const toolbar = (
    <div className="mb-3 flex items-center justify-end gap-2">
      {editing ? (
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw />
          Restablecer
        </Button>
      ) : null}
      <Button
        variant={editing ? "default" : "outline"}
        size="sm"
        onClick={() => setEditing((v) => !v)}
        aria-pressed={editing}
      >
        {editing ? (
          <>
            <Check />
            Listo
          </>
        ) : (
          <>
            <LayoutGrid />
            Editar diseño
          </>
        )}
      </Button>
    </div>
  );

  // Antes de montar (y en SSR) se pinta una versión apilada con los mismos
  // nodos: hay contenido en el primer paint, sin salto de hidratación y sin
  // depender de que el JS del grid haya cargado.
  if (!mounted) {
    return (
      <div>
        {toolbar}
        <div className="space-y-4">
          {widgets.map((w) => (
            <div key={w.id}>{w.node}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {toolbar}
      <ResponsiveGridLayout
        className="-mx-2"
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        margin={MARGIN}
        containerPadding={[8, 0]}
        compactType="vertical"
        isDraggable={editing}
        isResizable={editing}
        draggableHandle=".widget-drag-handle"
        onLayoutChange={handleLayoutChange}
        useCSSTransforms
      >
        {widgets.map((w) => (
          <div
            key={w.id}
            className={cn(
              "h-full overflow-hidden rounded-lg",
              editing &&
                "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
            )}
          >
            {editing ? (
              <button
                type="button"
                className="widget-drag-handle absolute right-2 top-2 z-20 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-md border border-border bg-card/90 text-muted-foreground shadow-sm backdrop-blur active:cursor-grabbing"
                aria-label="Mover widget"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            ) : null}

            {/*
              En modo edición el contenido no debe recibir clics (los KPIs y el
              calendario son enlaces): así arrastrar/soltar no navega. El tirador
              queda fuera de este contenedor, por eso sigue siendo interactivo.
            */}
            <div
              className={cn(
                "h-full [&>*]:h-full",
                editing && "pointer-events-none select-none",
              )}
            >
              {w.node}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
