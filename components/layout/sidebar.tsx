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
        <div
          key={section.label ?? "top-level"}
          className={cn(
            "space-y-1",
            // Los ítems sin grupo se separan con una línea para que se lean
            // como nivel superior y no como cola del grupo anterior.
            section.label === null && "border-t border-border pt-4",
          )}
        >
          {section.label ? (
            <p className="section-label px-3 pb-1">{section.label}</p>
          ) : null}

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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? // Gradiente diagonal sutil en el ítem activo (Fase 2).
                      "bg-gradient-to-br from-primary/20 to-primary/[0.06] font-medium text-primary"
                    : "font-normal text-muted-foreground hover:bg-accent hover:text-foreground",
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

/**
 * Bloque de perfil al fondo del sidebar: avatar con la inicial, nombre y plan.
 * `mt-auto` lo empuja abajo cuando el sidebar es una columna flex.
 */
export function SidebarUser({ name, email }: { name: string; email: string }) {
  const initial =
    (name.trim().charAt(0) || email.trim().charAt(0) || "?").toUpperCase();

  return (
    <div className="mt-auto border-t border-border p-3">
      <div className="flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-2.5">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        >
          {initial}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">Plan personal</p>
        </div>
      </div>
    </div>
  );
}

interface SidebarProps extends WelcomeProps {
  email: string;
}

/** Sidebar fijo en escritorio. En móvil se usa el drawer del topbar. */
export function Sidebar({ name, lastSession, email }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/70 backdrop-blur-sm lg:flex">
      <SidebarBrand />
      <SidebarWelcome name={name} lastSession={lastSession} />
      <SidebarNav />
      <SidebarUser name={name} email={email} />
    </aside>
  );
}
