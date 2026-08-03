-- ============================================================
-- 0001_initial_schema.sql
-- Dashboard de Finanzas Personales — schema inicial
-- Fuente: prompt-maestro-dashboard-finanzas.md
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================
-- ENUMS
-- ============================================================
create type account_type as enum ('debito', 'credito', 'efectivo', 'inversion', 'banca_nacional');
create type transaction_type as enum ('ingreso', 'gasto');
create type budget_period as enum ('semanal', 'mensual', 'anual');

-- ============================================================
-- TABLA: accounts
-- ============================================================
create table accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  type            account_type not null,
  institution     text,
  balance         numeric(14,2) not null default 0,  -- saldo inicial/base (ver vista account_balances)
  currency        text not null default 'DOP',
  created_at      timestamptz not null default now()
);

create index accounts_user_id_idx on accounts(user_id);

-- ============================================================
-- TABLA: categories (con jerarquía padre-hijo)
-- ============================================================
create table categories (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  emoji               text,
  color               text,
  parent_category_id  uuid references categories(id) on delete set null,
  created_at          timestamptz not null default now(),

  -- una categoría no puede ser su propio padre
  constraint categories_no_self_parent check (id <> parent_category_id)
);

create index categories_user_id_idx on categories(user_id);
create index categories_parent_idx on categories(parent_category_id);

-- ============================================================
-- TABLA: transactions
-- ============================================================
create table transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  account_id    uuid not null references accounts(id) on delete cascade,
  category_id   uuid references categories(id) on delete set null,
  type          transaction_type not null,
  amount        numeric(14,2) not null check (amount > 0),
  date          date not null default current_date,
  note          text,
  is_recurring  boolean not null default false,
  created_at    timestamptz not null default now()
);

create index transactions_user_id_idx on transactions(user_id);
create index transactions_account_id_idx on transactions(account_id);
create index transactions_category_id_idx on transactions(category_id);
create index transactions_date_idx on transactions(date);
-- índice compuesto para el heatmap (balance neto por día por usuario)
create index transactions_user_date_idx on transactions(user_id, date);

-- ============================================================
-- TABLA: goals
-- ============================================================
create table goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  emoji           text,
  target_amount   numeric(14,2) not null check (target_amount > 0),
  current_amount  numeric(14,2) not null default 0 check (current_amount >= 0),
  deadline        date not null,
  created_at      timestamptz not null default now()
);

create index goals_user_id_idx on goals(user_id);

-- ============================================================
-- TABLA: budgets
-- ============================================================
create table budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  category_id   uuid not null references categories(id) on delete cascade,
  period        budget_period not null,
  limit_amount  numeric(14,2) not null check (limit_amount > 0),
  created_at    timestamptz not null default now()
);

create index budgets_user_id_idx on budgets(user_id);
create index budgets_category_id_idx on budgets(category_id);
-- evita presupuestos duplicados para la misma categoría+periodo
create unique index budgets_unique_category_period on budgets(user_id, category_id, period);

-- ============================================================
-- VISTA: account_balances
-- Saldo consolidado (balance base + suma de transacciones)
-- security_invoker = true: la vista respeta el RLS del usuario
-- que consulta, no del dueño de la vista (obligatorio en RLS).
-- ============================================================
create view account_balances
with (security_invoker = true) as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.type,
  a.currency,
  a.balance as saldo_base,
  a.balance + coalesce(sum(
    case
      when t.type = 'ingreso' then t.amount
      when t.type = 'gasto'   then -t.amount
    end
  ), 0) as saldo_actual
from accounts a
left join transactions t on t.account_id = a.id
group by a.id, a.user_id, a.name, a.type, a.currency, a.balance;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table accounts     enable row level security;
alter table categories   enable row level security;
alter table transactions enable row level security;
alter table goals        enable row level security;
alter table budgets      enable row level security;

-- accounts
create policy "accounts_select_own" on accounts for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on accounts for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "accounts_delete_own" on accounts for delete using (auth.uid() = user_id);

-- categories
create policy "categories_select_own" on categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on categories for delete using (auth.uid() = user_id);

-- transactions
create policy "transactions_select_own" on transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete_own" on transactions for delete using (auth.uid() = user_id);

-- goals
create policy "goals_select_own" on goals for select using (auth.uid() = user_id);
create policy "goals_insert_own" on goals for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_delete_own" on goals for delete using (auth.uid() = user_id);

-- budgets
create policy "budgets_select_own" on budgets for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on budgets for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on budgets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_delete_own" on budgets for delete using (auth.uid() = user_id);
