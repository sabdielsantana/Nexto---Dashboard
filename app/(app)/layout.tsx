import { redirect } from "next/navigation";

import { format } from "date-fns";
import { es } from "date-fns/locale";

import { GlowBackground } from "@/components/layout/glow-background";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getUserPrefs } from "@/lib/queries/preferences";
import { getCurrentUser } from "@/lib/supabase/server";

/** Nombre a mostrar: metadata del perfil si existe, si no la parte local del correo. */
function displayName(user: {
  email?: string | undefined;
  user_metadata?: Record<string, unknown> | undefined;
}): string {
  const meta = user.user_metadata;
  const full = typeof meta?.["full_name"] === "string" ? meta["full_name"] : null;
  if (full && full.trim() !== "") return full.trim().split(/\s+/)[0] ?? full;

  const local = (user.email ?? "").split("@")[0] ?? "";
  if (local === "") return "de nuevo";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const prefs = await getUserPrefs();

  const rawLastSession =
    "last_sign_in_at" in user && typeof user.last_sign_in_at === "string"
      ? user.last_sign_in_at
      : null;
  const lastSession = rawLastSession
    ? format(new Date(rawLastSession), "d MMM, HH:mm", { locale: es })
    : null;

  const name = displayName(user);

  return (
    <div className="relative flex min-h-screen bg-background">
      <GlowBackground color={prefs.glow} />

      <Sidebar name={name} lastSession={lastSession} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          email={user.email ?? ""}
          name={name}
          lastSession={lastSession}
          glow={prefs.glow}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
