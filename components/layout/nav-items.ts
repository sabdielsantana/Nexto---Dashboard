import {
  BarChart3,
  CalendarDays,
  Calculator,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Tags,
  Target,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  /** Se muestra en versalitas sobre el grupo. */
  label: string;
  items: readonly NavItem[];
}

/**
 * Navegación agrupada por secciones.
 *
 * El calendario va en ACTIVIDAD: el mockup no lo incluye en su barra, pero la
 * ruta existe y funciona, así que se conserva en vez de dejarla huérfana.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: "General",
    items: [
      { href: "/", label: "Inicio", icon: LayoutDashboard },
      { href: "/analitica", label: "Analítica", icon: BarChart3 },
      { href: "/calculadora", label: "Calculadora", icon: Calculator },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { href: "/cuentas", label: "Cuentas", icon: Wallet },
      { href: "/presupuestos", label: "Presupuestos", icon: PiggyBank },
      { href: "/metas", label: "Metas", icon: Target },
    ],
  },
  {
    label: "Actividad",
    items: [
      { href: "/transacciones", label: "Transacciones", icon: Receipt },
      { href: "/categorias", label: "Categorías", icon: Tags },
      { href: "/calendario", label: "Calendario", icon: CalendarDays },
    ],
  },
];

/** Lista plana — la usa el topbar para resolver el título de la ruta activa. */
export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap(
  (section) => section.items,
);
