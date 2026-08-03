# Dashboard de Finanzas Personales — Instrucciones de proyecto

## Objetivo
App web de finanzas personales: cuentas, categorías, transacciones, presupuestos, metas de ahorro, calendario heatmap de balance diario, analítica visual y calculadora de interés compuesto.

## Alcance de esta fase
Construir **fases 2 a 8** (ver abajo). **NO** implementes el motor de insights con IA ni la integración de WhatsApp — quedan fuera de alcance hasta recibir especificación adicional (proveedor de WhatsApp Business API, umbrales de las reglas de detección de gastos hormiga). Si llegas a un punto donde necesitarías esas fases, detente y pregunta en vez de improvisar un placeholder funcional.

## Stack
- Next.js 14+ (App Router) + TypeScript estricto
- Tailwind CSS + shadcn/ui
- Recharts o Tremor para gráficos
- Supabase (Postgres + Auth + RLS)
- date-fns para manejo de fechas
- Zustand o Context API para estado global
- Mobile-first, responsive

## Base de datos — YA DEFINIDA, NO MODIFICAR SIN CONFIRMACIÓN
El schema vive en `supabase/migrations/0001_initial_schema.sql`, ya revisado y aprobado. Úsalo tal cual: aplícalo con `supabase db push` (o `supabase migration up` en local) y genera los tipos con `supabase gen types typescript --local > types/database.ts`.

Resumen de tablas (el detalle completo —constraints, índices, RLS— está en la migración):
- `accounts(id, user_id, name, type, institution, balance, currency, created_at)` — `type`: debito/credito/efectivo/inversion/banca_nacional. `balance` = saldo base, NO el saldo mostrado en UI.
- `categories(id, user_id, name, emoji, color, parent_category_id)` — jerarquía padre-hijo (subcategorías).
- `transactions(id, user_id, account_id, category_id, type, amount, date, note, is_recurring, created_at)` — `type`: ingreso/gasto.
- `goals(id, user_id, name, emoji, target_amount, current_amount, deadline)`
- `budgets(id, user_id, category_id, period, limit_amount)` — `period`: semanal/mensual/anual. Único por (user_id, category_id, period).
- Vista `account_balances` (con `security_invoker=true`): `saldo_actual = saldo_base + Σ(ingresos) - Σ(gastos)`. **Usa siempre esta vista para mostrar saldos** — nunca leas `accounts.balance` directo como saldo actual en la UI.

Todo monto monetario es `numeric(14,2)`. Toda tabla nueva que agregues debe llevar RLS scoped a `auth.uid() = user_id`, siguiendo el mismo patrón de policies de la migración.

## Orden de construcción (mostrar resultado de cada fase antes de avanzar)
1. ~~Schema Supabase~~ — completado, ver migración.
2. **Layout base**: sidebar + topbar + toggle claro/oscuro.
3. **CRUD de cuentas** (débito, crédito, efectivo, inversión/broker, banca nacional) y **categorías/subcategorías** con selector de emoji y color.
4. **CRUD de transacciones** con campo de nota, filtros por día/semana/mes/año.
5. **Calendario con heatmap** de balance neto diario. Click en un día abre sus transacciones. Usa el índice `(user_id, date)` de `transactions` para la consulta agregada por mes — no traigas todas las transacciones y agregues en cliente.
6. **Presupuestos por categoría** (alerta visual si se excede el límite) y **metas de ahorro** con barra de progreso y proyección de si se va a tiempo según el ritmo actual de ahorro.
7. **Analítica visual**: dona de gasto por categoría, barras de ingresos vs. gastos por periodo, línea de evolución de saldo.
8. **Calculadora de interés compuesto**: capital inicial, aporte periódico, tasa fija o variable por año, plazo en años, frecuencia de capitalización. Output: tabla + gráfico de proyección.

## Sistema de diseño
- **Modo oscuro por defecto**, toggle a claro persistente (localStorage o preferencia del sistema como fallback inicial).
- Paleta vibrante sobre fondo oscuro: verde = superávit/positivo, rojo = déficit/negativo, naranja = alerta/pendiente, azul = información/neutral, púrpura = acento secundario.
- Tarjetas KPI compactas en la parte superior del dashboard, con variación % (flecha + color según signo).
- Calendario heatmap estilo "Trade Echo": grid semanal, celdas con el monto neto del día, intensidad de verde/rojo proporcional a la magnitud, celda vacía = sin actividad.
- Badges de estado con icono + color: pendiente=naranja, en progreso=azul, enviado=púrpura, en revisión=amarillo, éxito=verde, fallido=rojo, expirado=gris.
- Tarjetas comparativas de cuentas con barra horizontal segmentada de distribución de activos/categorías (colores por segmento + leyenda con %).
- Notificaciones toast para confirmaciones (guardado, eliminado, error): fondo oscuro semitransparente, icono + color según tipo, auto-dismiss.

## Restricciones no negociables
- Nunca uses `float`/`double` para dinero — `numeric(14,2)` en DB, manejar como string o librería de precisión decimal en frontend si hace falta.
- RLS obligatorio en cualquier tabla nueva; cualquier vista nueva necesita `security_invoker = true`.
- No dupliques `balance` como fuente de verdad de saldo actual — pasa siempre por `account_balances`.
- TypeScript estricto (sin `any` salvo justificación explícita), componentes reutilizables.
