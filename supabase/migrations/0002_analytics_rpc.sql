-- ============================================================
-- 0002_analytics_rpc.sql
-- Funciones de agregación para heatmap, analítica y presupuestos.
--
-- No modifica el schema de 0001: solo añade funciones de lectura.
-- Todas son `security invoker` + `stable`, así que respetan el RLS del
-- usuario que consulta (mismo criterio que `security_invoker = true` en la
-- vista account_balances). Además filtran explícitamente por auth.uid().
--
-- Motivo: la agregación por día/categoría/periodo tiene que ocurrir en la DB
-- aprovechando el índice (user_id, date) — no traer todas las transacciones
-- al cliente.
-- ============================================================

-- Valida el bucket temporal recibido para no pasar texto arbitrario a date_trunc.
create or replace function _assert_bucket(p_bucket text)
returns text
language plpgsql
immutable
as $$
begin
  if p_bucket not in ('day', 'week', 'month', 'year') then
    raise exception 'bucket invalido: %. Use day | week | month | year', p_bucket;
  end if;
  return p_bucket;
end;
$$;

-- ============================================================
-- daily_net_balance — alimenta el calendario heatmap
-- Usa el índice transactions(user_id, date).
-- ============================================================
create or replace function daily_net_balance(p_start date, p_end date)
returns table (
  day       date,
  ingresos  numeric(14,2),
  gastos    numeric(14,2),
  neto      numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    t.date as day,
    coalesce(sum(t.amount) filter (where t.type = 'ingreso'), 0)::numeric(14,2) as ingresos,
    coalesce(sum(t.amount) filter (where t.type = 'gasto'), 0)::numeric(14,2)   as gastos,
    (
      coalesce(sum(t.amount) filter (where t.type = 'ingreso'), 0)
      - coalesce(sum(t.amount) filter (where t.type = 'gasto'), 0)
    )::numeric(14,2) as neto
  from transactions t
  where t.user_id = auth.uid()
    and t.date between p_start and p_end
  group by t.date
  order by t.date;
$$;

-- ============================================================
-- period_totals — KPIs del dashboard
-- ============================================================
create or replace function period_totals(p_start date, p_end date)
returns table (
  ingresos numeric(14,2),
  gastos   numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(t.amount) filter (where t.type = 'ingreso'), 0)::numeric(14,2),
    coalesce(sum(t.amount) filter (where t.type = 'gasto'), 0)::numeric(14,2)
  from transactions t
  where t.user_id = auth.uid()
    and t.date between p_start and p_end;
$$;

-- ============================================================
-- spending_by_category — dona de gasto por categoría
-- ============================================================
create or replace function spending_by_category(p_start date, p_end date)
returns table (
  category_id   uuid,
  category_name text,
  emoji         text,
  color         text,
  total         numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id as category_id,
    coalesce(c.name, 'Sin categoría') as category_name,
    c.emoji,
    c.color,
    sum(t.amount)::numeric(14,2) as total
  from transactions t
  left join categories c on c.id = t.category_id
  where t.user_id = auth.uid()
    and t.type = 'gasto'
    and t.date between p_start and p_end
  group by c.id, c.name, c.emoji, c.color
  order by sum(t.amount) desc;
$$;

-- ============================================================
-- income_vs_expense — barras de ingresos vs gastos por periodo
-- ============================================================
create or replace function income_vs_expense(p_start date, p_end date, p_bucket text)
returns table (
  bucket   date,
  ingresos numeric(14,2),
  gastos   numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    date_trunc(_assert_bucket(p_bucket), t.date)::date as bucket,
    coalesce(sum(t.amount) filter (where t.type = 'ingreso'), 0)::numeric(14,2),
    coalesce(sum(t.amount) filter (where t.type = 'gasto'), 0)::numeric(14,2)
  from transactions t
  where t.user_id = auth.uid()
    and t.date between p_start and p_end
  group by 1
  order by 1;
$$;

-- ============================================================
-- balance_evolution — línea de evolución de saldo
-- Saldo acumulado = Σ saldos base + neto de transacciones previas
--                   + neto acumulado dentro del rango.
-- Coherente con la vista account_balances.
-- ============================================================
create or replace function balance_evolution(p_start date, p_end date, p_bucket text)
returns table (
  bucket date,
  neto   numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  with base as (
    select coalesce(sum(a.balance), 0) as monto
    from accounts a
    where a.user_id = auth.uid()
  ),
  previo as (
    select coalesce(sum(
      case when t.type = 'ingreso' then t.amount else -t.amount end
    ), 0) as monto
    from transactions t
    where t.user_id = auth.uid()
      and t.date < p_start
  ),
  por_bucket as (
    select
      date_trunc(_assert_bucket(p_bucket), t.date)::date as bucket,
      sum(case when t.type = 'ingreso' then t.amount else -t.amount end) as delta
    from transactions t
    where t.user_id = auth.uid()
      and t.date between p_start and p_end
    group by 1
  )
  select
    b.bucket,
    (
      (select monto from base)
      + (select monto from previo)
      + sum(b.delta) over (order by b.bucket rows between unbounded preceding and current row)
    )::numeric(14,2) as neto
  from por_bucket b
  order by b.bucket;
$$;

-- ============================================================
-- budget_usage — consumo de cada presupuesto en la ventana dada
-- El gasto de una categoría incluye el de sus subcategorías
-- (jerarquía parent_category_id, profundidad arbitraria).
-- ============================================================
create or replace function budget_usage(p_period budget_period, p_start date, p_end date)
returns table (
  budget_id     uuid,
  category_id   uuid,
  category_name text,
  emoji         text,
  color         text,
  limit_amount  numeric(14,2),
  gastado       numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  with recursive descendientes as (
    -- raíz: la categoría del propio presupuesto
    select b.id as budget_id, b.category_id as cat_id
    from budgets b
    where b.user_id = auth.uid()
      and b.period = p_period
    union all
    -- hijos de cada nivel
    select d.budget_id, c.id
    from descendientes d
    join categories c on c.parent_category_id = d.cat_id
    where c.user_id = auth.uid()
  )
  select
    b.id as budget_id,
    b.category_id,
    c.name as category_name,
    c.emoji,
    c.color,
    b.limit_amount,
    coalesce((
      select sum(t.amount)
      from transactions t
      where t.user_id = auth.uid()
        and t.type = 'gasto'
        and t.date between p_start and p_end
        and t.category_id in (select d.cat_id from descendientes d where d.budget_id = b.id)
    ), 0)::numeric(14,2) as gastado
  from budgets b
  join categories c on c.id = b.category_id
  where b.user_id = auth.uid()
    and b.period = p_period
  order by c.name;
$$;
