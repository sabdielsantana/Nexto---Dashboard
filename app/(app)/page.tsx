import Link from "next/link";

import { ArrowRight, PiggyBank, Target, Wallet } from "lucide-react";

import { AccountsSummary } from "@/components/dashboard/accounts-summary";
import { GoalsSummary } from "@/components/dashboard/goals-summary";
import { KpiGrid } from "@/components/dashboard/kpi-card";
import { SpendingDonut } from "@/components/charts/spending-donut";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { BUDGET_PERIOD_LABELS } from "@/lib/constants";
import { previousRangeForPeriod, rangeForPeriod } from "@/lib/dates";
import { getAccountsWithBalances, getAccountOptions } from "@/lib/queries/accounts";
import { getBudgetUsage, getPeriodTotals, getSpendingByCategory } from "@/lib/queries/analytics";
import { budgetWindow } from "@/lib/queries/budgets";
import { getCategoryOptions } from "@/lib/queries/categories";
import { getGoals } from "@/lib/queries/goals";
import { getRecentTransactions } from "@/lib/queries/transactions";
import { BudgetAlerts } from "@/components/dashboard/budget-alerts";

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
  ]);

  const isEmpty = accounts.length === 0;

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
        <div className="space-y-4">
          <KpiGrid totals={totals} previousTotals={previousTotals} />

          <AccountsSummary accounts={accounts} />

          <BudgetAlerts
            usage={budgetUsage}
            periodLabel={BUDGET_PERIOD_LABELS.mensual}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Gasto por categoría</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/analitica">
                    Ver analítica
                    <ArrowRight />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <SpendingDonut data={spending} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
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
                <CardContent>
                  <GoalsSummary goals={goals} />
                </CardContent>
              </Card>

              <Card>
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
                <CardContent className="px-0 pb-0">
                  <TransactionList
                    transactions={recent}
                    accounts={accountOptions}
                    categories={categories}
                    readOnly
                    emptyDescription="Registra tu primera transacción para verla aquí."
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
