-- ============================================================
-- 0003_user_preferences.sql
-- Preferencias de interfaz por usuario.
--
-- No toca ninguna tabla, columna ni policy de 0001. Sigue el mismo patrón:
-- RLS scoped a auth.uid() = user_id.
--
-- Es deliberadamente genérica en vez de una tabla solo para el layout: hoy
-- guarda el color del glow, y `layout_config` queda preparada para el grid de
-- posicionamiento libre sin necesidad de otra migración.
-- ============================================================

-- Ambientes disponibles para el glow del fondo.
create type glow_color as enum (
  'purpura',
  'azul',
  'verde',
  'naranja',
  'rosa',
  'ninguno'
);

create table user_preferences (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  glow          glow_color not null default 'purpura',
  -- Posiciones de los widgets: { widgetId, x, y, w, h, visible }[].
  -- Nulo hasta que el usuario reordene por primera vez; la app cae al
  -- layout por defecto mientras tanto.
  layout_config jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table user_preferences enable row level security;

create policy "user_preferences_select_own" on user_preferences
  for select using (auth.uid() = user_id);
create policy "user_preferences_insert_own" on user_preferences
  for insert with check (auth.uid() = user_id);
create policy "user_preferences_update_own" on user_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_preferences_delete_own" on user_preferences
  for delete using (auth.uid() = user_id);

-- ============================================================
-- updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_preferences_set_updated_at
  before update on user_preferences
  for each row execute function set_updated_at();
