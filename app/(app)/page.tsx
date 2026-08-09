import Link from "next/link";

import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  PiggyBank,
  Target,
  Wallet,
} from "lucide-react";

import { AccountsSummary } from "@/components/dashboard/accounts-summary";
import { CalendarPreview } from "@/components/dashboard/calendar-preview";
import {
  DashboardGrid,
  type DashboardWidget,
} from "@/components/dashboard/dashboard-grid";
import { DailyActivity } from "@/components/dashboard/daily-activity";
import { GoalsSummary } from "@/components/dashboard/goals-summary";
import { KpiGrid } from "@/components/dashboard/kpi-card";
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars";
import { SpendingDonut } from "@/components/charts/spending-donut";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { BUDGET_PERIOD_LABELS } from "@/lib/constants";
import {
  bucketForPeriod,
  lastSevenDays,
  lastSevenDaysRange,
  previousRangeForPeriod,
  rangeForPeriod,
} from "@/lib/dates";
import { getAccountsWithBalances, getAccountOptions } from "@/lib/queries/accounts";
import {
  getBudgetUsage,
  getDailyNetBalance,
  getIncomeVsExpense,
  getPeriodTotals,
  getSpendingByCategory,
} from "@/lib/queries/analytics";
import { budgetWindow } from "@/lib/queries/budgets";
import { getCategoryOptions } from "@/lib/queries/categories";
import { getGoals } from "@/lib/queries/goals";
import { getRecentTransactions } from "@/lib/queries/transactions";
import { BudgetAlerts } from "@/components/dashboard/budget-alerts";
import { hasBudgetAlerts } from "@/lib/budget-alerts";

export const metadata = { title: "Dashboard — Nexto" };

export default async function DashboardPage() {
  const now = new Date();
  const range = rangeForPeriod("mes", now);
  const previousRange = previousRangeForPeriod("mes", now);
  const monthlyBudgetWindow = budgetWindow("mensual", now);

  const [
    totals,
    previousTotals,
    accounts,
    spending,
    recent,
    goals,
    budgetUsage,
    accountOptions,
    categories,
    dailyBalance,
    incomeVsExpense,
    weekBalance,
  ] = await Promise.all([
    getPeriodTotals(range),
    getPeriodTotals(previousRange),
    getAccountsWithBalances(),
    getSpendingByCategory(range),
    getRecentTransactions(6),
    getGoals(),
    getBudgetUsage("mensual", monthlyBudgetWindow),
    getAccountOptions(),
    getCategoryOptions(),
    getDailyNetBalance(range),
    getIncomeVsExpense(range, bucketForPeriod("mes")),
    getDailyNetBalance(lastSevenDaysRange(now)),
  ]);

  const isEmpty = accounts.length === 0;

  // Cada widget se renderiza aquí, en el servidor, con sus datos ya resueltos.
  // El grid (cliente) solo recibe los nodos y se encarga de arrastrar/redimensionar:
  // ningún dato ni consulta cruza al cliente, solo props serializables y el JSX ya
  // renderizado. Los widgets no saben que viven dentro de un grid.
  const widgets: DashboardWidget[] = [
    {
      id: "kpi",
      node: <KpiGrid totals={totals} previousTotals={previousTotals} />,
    },
    {
      id: "patrimonio",
      node: <AccountsSummary accounts={accounts} />,
    },
    // Las alertas solo se montan si hay algo que mostrar; si no, el grid ni
    // siquiera reserva su hueco.
    ...(hasBudgetAlerts(budgetUsage)
      ? [
          {
            id: "budget-alerts",
            node: (
              <BudgetAlerts
                usage={budgetUsage}
                periodLabel={BUDGET_PERIOD_LABELS.mensual}
              />
            ),
          } satisfies DashboardWidget,
        ]
      : []),
    {
      id: "daily-activity",
      node: (
        <Card className="flex h-full flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex min-w-0 items-center gap-2 text-base">
              <Activity className="h-4 w-4 shrink-0" />
              <span className="truncate">Actividad diaria</span>
            </CardTitle>
            {/* Solo icono: en una tarjeta estrecha el texto partía el título. */}
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label="Ver calendario"
            >
              <Link href="/calendario">
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <DailyActivity days={dailyBalance} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "income-expense",
      node: (
        <Card className="flex h-full flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Ingresos vs. gastos
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/analitica">
                Ver analítica
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <IncomeExpenseBars
              data={incomeVsExpense}
              bucket={bucketForPeriod("mes")}
            />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "calendar",
      node: (
        <Link
          href="/calendario"
          aria-label="Calendario: ver el mes completo"
          className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Card className="flex h-full flex-col transition-colors hover:border-primary/40 hover:bg-accent/40">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span className="truncate">Calendario</span>
              </CardTitle>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                Últimos 7 días
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </CardHeader>
            <CardContent className="min-h-0 flex-1">
              <CalendarPreview days={lastSevenDays(now)} balances={weekBalance} />
            </CardContent>
          </Card>
        </Link>
      ),
    },
    {
      id: "spending",
      node: (
        <Card className="flex h-full flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Gasto por categoría</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/analitica">
                Ver analítica
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <SpendingDonut data={spending} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "goals",
      node: (
        <Card className="flex h-full flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Metas
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/metas">
                Ver todas
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-auto">
            <GoalsSummary goals={goals} />
          </CardContent>
        </Card>
      ),
    },
    {
      id: "transactions",
      node: (
        <Card className="flex h-full flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="h-4 w-4" />
              Últimos movimientos
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/transacciones">
                Ver todos
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-auto px-0 pb-0">
            <TransactionList
              transactions={recent}
              accounts={accountOptions}
              categories={categories}
              readOnly
              emptyDescription="Registra tu primera transacción para verla aquí."
            />
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Resumen del mes"
        description="Tus saldos, tu gasto y tus metas de un vistazo."
      />

      {isEmpty ? (
        <EmptyState
          icon={Wallet}
          title="Empieza creando una cuenta"
          description="Añade tus cuentas bancarias, efectivo o inversiones para empezar a ver tus finanzas aquí."
          action={
            <Button asChild>
              <Link href="/cuentas">
                Ir a cuentas
                <ArrowRight />
              </Link>
            </Button>
          }
        />
      ) : (
        <DashboardGrid widgets={widgets} />
      )}
    </>
  );
}
