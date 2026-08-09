"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_SECTIONS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  /** Se invoca al navegar — cierra el drawer en móvil. */
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4 scrollbar-thin">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="space-y-1">
          <p className="section-label px-3 pb-1">{section.label}</p>

          {section.items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SidebarBrand() {
  return (
    <div className="flex h-16 items-center gap-2.5 px-5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base">
        💠
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">Nexto</p>
        <p className="text-xs text-muted-foreground">Finanzas personales</p>
      </div>
    </div>
  );
}

interface WelcomeProps {
  name: string;
  lastSession: string | null;
}

/** Saludo personalizado, antes de la navegación. */
export function SidebarWelcome({ name, lastSession }: WelcomeProps) {
  return (
    <div className="border-b border-border px-5 pb-5 pt-1">
      <p className="text-sm text-muted-foreground">Bienvenido de nuevo,</p>
      <p className="text-2xl font-bold leading-tight tracking-tighter">{name}</p>
      {lastSession ? (
        <p className="pt-1.5 text-xs text-muted-foreground">
          Última sesión: {lastSession}
        </p>
      ) : null}
    </div>
  );
}

/** Sidebar fijo en escritorio. En móvil se usa el drawer del topbar. */
export function Sidebar({ name, lastSession }: WelcomeProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/70 backdrop-blur-sm lg:flex">
      <SidebarBrand />
      <SidebarWelcome name={name} lastSession={lastSession} />
      <SidebarNav />
    </aside>
  );
}
