# Nexto — Dashboard de Finanzas Personales

App web de finanzas personales: cuentas, categorías, transacciones, presupuestos,
metas de ahorro, calendario heatmap, analítica visual y calculadora de interés
compuesto.

Stack: **Next.js 14 (App Router) · TypeScript estricto · Tailwind + shadcn/ui ·
Supabase (Postgres + Auth + RLS) · Recharts · date-fns**.

---

## Puesta en marcha

```bash
npm install

# 1. Levanta Supabase y aplica las migraciones
supabase start
supabase db push            # o: supabase migration up

# 2. Regenera los tipos desde tu instancia (ver nota más abajo)
npm run db:types

# 3. Variables de entorno
cp .env.example .env.local  # y completa URL + anon key

# 4. Arranca
npm run dev
```

Comprobaciones:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # build de producción
```

---

## Estado: fases 2 a 8 completas

| Fase | Alcance | Dónde |
|------|---------|-------|
| 2 | Layout: sidebar, topbar, tema claro/oscuro | `components/layout/` |
| 3 | CRUD de cuentas y categorías/subcategorías | `app/(app)/cuentas`, `app/(app)/categorias` |
| 4 | CRUD de transacciones + filtros día/semana/mes/año | `app/(app)/transacciones` |
| 5 | Calendario heatmap de balance diario | `app/(app)/calendario` |
| 6 | Presupuestos con alerta y metas con proyección | `app/(app)/presupuestos`, `app/(app)/metas` |
| 7 | Analítica: dona, barras y línea de saldo | `app/(app)/analitica` |
| 8 | Calculadora de interés compuesto | `app/(app)/calculadora` |

**Fuera de alcance por indicación explícita:** el motor de insights con IA y la
integración de WhatsApp. No se implementó ningún placeholder de esas fases —
hacen falta el proveedor de WhatsApp Business API y los umbrales de las reglas
de detección de gastos hormiga.

---

## Decisiones que conviene revisar

### 1. Se añadió una migración nueva: `0002_analytics_rpc.sql`

`0001_initial_schema.sql` se aplicó **tal cual, sin modificar**. Pero la fase 5
pide agregar el balance diario en la base de datos usando el índice
`(user_id, date)` en vez de traer todas las transacciones y sumarlas en el
cliente, y con `supabase-js` no se puede expresar un `GROUP BY` directamente.

La migración 0002 **no toca ninguna tabla, columna ni policy existente**: solo
añade funciones de lectura:

| Función | Uso |
|---|---|
| `daily_net_balance(start, end)` | Heatmap del calendario |
| `period_totals(start, end)` | Tarjetas KPI |
| `spending_by_category(start, end)` | Dona de gasto |
| `income_vs_expense(start, end, bucket)` | Barras ingresos vs. gastos |
| `balance_evolution(start, end, bucket)` | Línea de evolución de saldo |
| `budget_usage(period, start, end)` | Consumo de presupuestos |

Todas son `stable` + `security invoker`, así que respetan el RLS del usuario que
consulta — el mismo criterio que `security_invoker = true` en la vista
`account_balances`. Además filtran explícitamente por `auth.uid()`.
`_assert_bucket()` valida el parámetro temporal para que nunca llegue texto
arbitrario a `date_trunc`.

`budget_usage` incluye el gasto de las **subcategorías** en el presupuesto de la
categoría padre (CTE recursiva, profundidad arbitraria): un presupuesto de
"Comida" cuenta también "Comida › Restaurantes › Delivery". Si prefieres que
cada presupuesto cuente solo su categoría exacta, es un cambio de una línea.

### 2. `types/database.ts` está escrito a mano

`supabase gen types` necesita una instancia de Supabase corriendo, que este
entorno no tiene. El archivo está alineado 1:1 con ambas migraciones e incluye
las firmas de las funciones RPC. **Regénralo con `npm run db:types` en cuanto
tengas Supabase levantado** y descarta la versión manual.

### 3. Cómo viaja el dinero por la app

La restricción "nunca `float`/`double` para dinero" se cumple así:

- **En la DB**: `numeric(14,2)`, según el schema original.
- **En la app**: todo monto se maneja como **centavos en `bigint`**
  (`lib/money.ts`). No hay aritmética monetaria en punto flotante.
- **Cruzando Server → Client Component**: como **cadena decimal** (`"1234.50"`).
  `bigint` no es serializable en el payload RSC y `number` reintroduciría el
  float; la cadena conserva los dos decimales exactos y el cliente la
  reconstruye con `toMoney()`.
- **Solo al final**, para alimentar Recharts, se convierte a `number` — nunca
  para acumular ni comparar.

### 4. Multi-moneda: los totales no convierten divisas

El schema guarda `currency` por cuenta pero no tiene tasas de cambio. Los
totales agregados (patrimonio, KPIs, heatmap) **suman los montos tal cual entre
monedas distintas**, así que con cuentas en varias divisas son orientativos. Los
saldos por cuenta individual sí se muestran en su propia moneda y son correctos.
Resolverlo requiere decidir de dónde salen las tasas — dilo y lo añado.

### 5. La calculadora redondea al centavo en cada periodo

`calculateCompoundInterest` aplica la tasa y redondea a centavo en **cada
periodo de capitalización**, replicando cómo una cuenta real acredita
intereses. Por eso el resultado puede diferir unos centavos de la fórmula
continua `P·(1+i)^n`: 1000 al 12% nominal con capitalización mensual durante un
año da **1126.84** aquí frente a 1126.8250 en matemática continua. Es
intencional, no un error de redondeo.

### 6. Ritmo de ahorro de las metas

La proyección de si una meta llega a tiempo compara el ritmo observado
(`current_amount` repartido entre los días desde `created_at`) con el necesario
para cubrir lo que falta antes de `deadline`. Es la mejor aproximación con el
schema actual, que guarda el acumulado pero **no el historial de aportes**. Con
una tabla de aportes el ritmo sería mucho más preciso — implicaría una tabla
nueva, así que no la añadí sin confirmación.

---

## Verificación realizada

**Migraciones contra Postgres 16 real** (instancia efímera con un shim de
`auth.users` / `auth.uid()`):

- `0001` y `0002` aplican sin errores.
- Cada RPC devuelve los valores correctos con datos sembrados; el acumulado de
  `balance_evolution` cierra exactamente en el mismo saldo que
  `account_balances`.
- `budget_usage` suma bien la jerarquía de dos niveles (100 + 50.25 + 20.75 =
  171.00).
- **RLS**: un segundo usuario no ve nada del primero, ni por las tablas, ni por
  la vista, ni por las funciones. Sin sesión (`auth.uid()` nulo) todo devuelve
  cero filas — falla cerrado, nunca abierto.
- `_assert_bucket` rechaza un bucket arbitrario.
- Los constraints del schema original se comportan como se documenta en la UI
  (monto > 0, presupuesto único por categoría+periodo, borrar una categoría
  padre deja las hijas como raíz sin borrar transacciones).

**Lógica pura**: 37 comprobaciones numéricas sobre `lib/money.ts`,
`lib/compound-interest.ts` y `lib/goals.ts` (parseo y redondeo de decimales,
anualidades, tasa variable por año, tasa efectiva, estados de meta). Todas
pasan.

**App**: `tsc --noEmit` limpio con `strict` + `noUncheckedIndexedAccess`,
`eslint` sin avisos, y `next build` correcto en las 13 rutas.

Lo que **no** está verificado: no hay suite de tests automatizada en el repo (las
comprobaciones anteriores fueron scripts de validación puntuales), y la UI no se
ha ejercitado contra una instancia real de Supabase con un usuario autenticado,
porque este entorno no tiene uno.

---

## Estructura

```
app/
  (app)/                 # rutas protegidas: layout con sidebar + topbar
    page.tsx             # dashboard
    cuentas/ categorias/ transacciones/ calendario/
    presupuestos/ metas/ analitica/ calculadora/
    */actions.ts         # Server Actions de mutación
  login/                 # auth
components/
  ui/                    # primitivas shadcn/ui
  layout/ accounts/ categories/ transactions/
  calendar/ budgets/ goals/ charts/ dashboard/ calculator/
lib/
  money.ts               # aritmética monetaria en centavos (bigint)
  compound-interest.ts   # motor de la calculadora
  goals.ts               # proyección de metas
  dates.ts               # periodos y rangos
  supabase/              # clientes browser / server / middleware
  queries/               # lectura de datos (server-only)
types/database.ts
supabase/migrations/
```

Cualquier tabla nueva debe llevar RLS con `auth.uid() = user_id` siguiendo el
patrón de `0001`, y cualquier vista nueva `security_invoker = true`.
