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

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cuentas", label: "Cuentas", icon: Wallet },
  { href: "/categorias", label: "Categorías", icon: Tags },
  { href: "/transacciones", label: "Transacciones", icon: Receipt },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/presupuestos", label: "Presupuestos", icon: PiggyBank },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/analitica", label: "Analítica", icon: BarChart3 },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
];
