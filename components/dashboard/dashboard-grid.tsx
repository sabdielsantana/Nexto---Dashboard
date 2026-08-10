"use client";

// Estilos base de react-grid-layout (transiciones, placeholder, tiradores de
// resize). En 1.x el paquete trae los estilos de react-resizable incluidos, así
// que solo hace falta este import; el tema se ajusta en globals.css.
import "react-grid-layout/css/styles.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Check,
  EyeOff,
  GripVertical,
  LayoutGrid,
  Maximize2,
  MoreVertical,
  RotateCcw,
} from "lucide-react";
import {
  Responsive,
  WidthProvider,
  type Layout,
  type Layouts,
} from "react-grid-layout";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  { id: "kpi", h: 4, lg: 12, md: 10, sm: 6 },
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

// v2: el alto por defecto del widget KPI cambió con el rediseño (4ª tarjeta y
// tipografía grande); subir la versión descarta layouts guardados que dejarían
// la última KPI recortada.
const STORAGE_KEY = "nexto:dashboard-layout:v2";
const HIDDEN_KEY = "nexto:dashboard-hidden:v2";

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
 * se muestra (condicional u ocultado), y un widget nuevo cae en su posición por
 * defecto en vez de quedar sin sitio.
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

/** Devuelve un id a su tamaño por defecto (w/h) en todos los breakpoints. */
function resetItemSize(layouts: Layouts, id: string): Layouts {
  const out: Layouts = {};
  for (const bp of BREAKPOINT_KEYS) {
    const def = (DEFAULT_LAYOUTS[bp] ?? []).find((i) => i.i === id);
    out[bp] = (layouts[bp] ?? []).map((item) =>
      item.i === id && def ? { ...item, w: def.w, h: def.h } : item,
    );
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

function readHidden(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HIDDEN_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function persist(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cuota llena o almacenamiento deshabilitado: no es crítico, el panel
    // sigue funcionando con el estado en memoria.
  }
}

function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignorar
  }
}

/** "Actualizado hace X min" a partir de los minutos transcurridos. */
function formatElapsed(minutes: number): string {
  if (minutes <= 0) return "Actualizado ahora";
  if (minutes === 1) return "Actualizado hace 1 min";
  if (minutes < 60) return `Actualizado hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "Actualizado hace 1 h" : `Actualizado hace ${hours} h`;
}

export function DashboardGrid({
  widgets,
  lastUpdated,
}: {
  widgets: DashboardWidget[];
  /** Momento (ms epoch) del fetch de datos en el servidor, para el indicador. */
  lastUpdated: number;
}) {
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());

  const visibleWidgets = useMemo(
    () => widgets.filter((w) => !hidden.has(w.id)),
    [widgets, hidden],
  );

  const [layouts, setLayouts] = useState<Layouts>(() =>
    reconcile(null, new Set(widgets.map((w) => w.id))),
  );
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Ignora los onLayoutChange que dispara react-grid-layout al montar y al
  // compactar por primera vez: solo persistimos cambios hechos por el usuario.
  const hydrated = useRef(false);

  // Minutos transcurridos desde el último fetch; se refresca cada minuto (#7).
  const [elapsedMin, setElapsedMin] = useState(0);
  useEffect(() => {
    const tick = () =>
      setElapsedMin(Math.max(0, Math.floor((Date.now() - lastUpdated) / 60000)));
    tick();
    const id = window.setInterval(tick, 60000);
    return () => window.clearInterval(id);
  }, [lastUpdated]);

  // La hidratación del layout guardado vive en un efecto para no leer
  // localStorage durante el render (evita desajustes servidor/cliente).
  useEffect(() => {
    const savedHidden = readHidden();
    const savedLayout = readSaved();
    const hiddenSet = new Set(savedHidden.filter((id) => id !== undefined));
    const presentIds = new Set(
      widgets.filter((w) => !hiddenSet.has(w.id)).map((w) => w.id),
    );
    setHidden(hiddenSet);
    setLayouts(reconcile(savedLayout, presentIds));
    setDirty(savedLayout !== null || savedHidden.length > 0);
    setMounted(true);
    hydrated.current = true;
    // Solo al montar: la reconciliación posterior por cambios de `hidden`/drag
    // se gestiona en sus propios handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLayoutChange = useCallback((_current: Layout[], all: Layouts) => {
    setLayouts(all);
    if (hydrated.current) {
      persist(STORAGE_KEY, all);
      setDirty(true);
    }
  }, []);

  const hideWidget = useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(id);
      persist(HIDDEN_KEY, [...next]);
      return next;
    });
    setDirty(true);
  }, []);

  const resetSize = useCallback((id: string) => {
    setLayouts((prev) => {
      const next = resetItemSize(prev, id);
      persist(STORAGE_KEY, next);
      return next;
    });
    setDirty(true);
  }, []);

  const resetAll = useCallback(() => {
    const allIds = new Set(widgets.map((w) => w.id));
    setHidden(new Set());
    setLayouts(reconcile(null, allIds));
    removeKey(STORAGE_KEY);
    removeKey(HIDDEN_KEY);
    setDirty(false);
  }, [widgets]);

  const indicator = (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-positive" />
      </span>
      {formatElapsed(elapsedMin)}
    </span>
  );

  const toolbar = (
    <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
      {indicator}
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={resetAll}
          disabled={!dirty}
        >
          <RotateCcw />
          Restablecer diseño
        </Button>
        <Button
          variant={editing ? "default" : "outline"}
          size="sm"
          onClick={() => setEditing((v) => !v)}
          aria-pressed={editing}
        >
          {editing ? <Check /> : <LayoutGrid />}
          {editing ? "Listo" : "Editar widgets"}
        </Button>
      </div>
    </div>
  );

  /** Menú ⋮ de un widget: ocultar o restablecer su tamaño (#5). */
  const widgetMenu = (id: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Opciones del widget"
          className={cn(
            "absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card/90 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 data-[state=open]:opacity-100",
            editing && "opacity-100",
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => hideWidget(id)}>
          <EyeOff />
          Ocultar widget
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => resetSize(id)}>
          <Maximize2 />
          Restablecer tamaño
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Antes de montar (y en SSR) se pinta una versión apilada con los mismos
  // nodos: hay contenido en el primer paint, sin salto de hidratación y sin
  // depender de que el JS del grid haya cargado.
  if (!mounted) {
    return (
      <div>
        {toolbar}
        <div className="space-y-4">
          {visibleWidgets.map((w) => (
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
        {visibleWidgets.map((w) => (
          <div
            key={w.id}
            className={cn(
              "group h-full overflow-hidden rounded-lg",
              editing &&
                "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
            )}
          >
            {widgetMenu(w.id)}

            {editing ? (
              <button
                type="button"
                className="widget-drag-handle absolute right-11 top-2 z-20 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-md border border-border bg-card/90 text-muted-foreground shadow-sm backdrop-blur active:cursor-grabbing"
                aria-label="Mover widget"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            ) : null}

            {/*
              En modo edición el contenido no debe recibir clics (los KPIs y el
              calendario son enlaces): así arrastrar/soltar no navega. El tirador
              y el menú quedan fuera de este contenedor, por eso siguen siendo
              interactivos.
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
