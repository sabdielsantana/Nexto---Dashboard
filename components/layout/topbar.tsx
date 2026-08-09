"use client";

import { useState } from "react";

import { LogOut, Menu, Plus } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/login/actions";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { SidebarBrand, SidebarNav, SidebarWelcome } from "@/components/layout/sidebar";
import { GlowPicker } from "@/components/layout/glow-picker";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";

import type { GlowColor } from "@/types/database";

interface TopbarProps {
  email: string;
  name: string;
  lastSession: string | null;
  glow: GlowColor;
}

export function Topbar({ email, name, lastSession, glow }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const current = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );

  const initial = email.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      {/* Drawer de navegación en móvil */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
            <Menu />
          </Button>
        </DialogTrigger>
        <DialogContent className="left-0 top-0 h-full max-w-[17rem] translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-l-0 p-0">
          <DialogTitle className="sr-only">Navegación</DialogTitle>
          <SidebarBrand />
          <SidebarWelcome name={name} lastSession={lastSession} />
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
        </DialogContent>
      </Dialog>

      <h1 className="truncate text-base font-semibold tracking-tight lg:text-lg">
        {current?.label ?? "Nexto"}
      </h1>

      <div className="ml-auto flex items-center gap-1.5">
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/transacciones?nueva=1">
            <Plus />
            Nueva transacción
          </Link>
        </Button>
        <Button asChild size="icon" className="sm:hidden" aria-label="Nueva transacción">
          <Link href="/transacciones?nueva=1">
            <Plus />
          </Link>
        </Button>

        <GlowPicker current={glow} />

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Menú de cuenta"
              className="rounded-full"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accentAlt/20 text-sm font-semibold text-accentAlt">
                {initial}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <button type="submit" className="w-full">
                <DropdownMenuItem className="text-negative-fg focus:text-negative-fg">
                  <LogOut />
                  Cerrar sesión
                </DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
