import { PeriodPicker } from "@/components/analytics/period-picker";
import { BalanceLine } from "@/components/charts/balance-line";
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars";
import { SpendingDonut } from "@/components/charts/spending-donut";
import { KpiGrid } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  bucketForPeriod,
  fromDateKey,
  previousRangeForPeriod,
  rangeForPeriod,
} from "@/lib/dates";
import {
  getBalanceEvolution,
  getIncomeVsExpense,
  getPeriodTotals,
  getSpendingByCategory,
} from "@/lib/queries/analytics";
import {
  type SearchParams,
  parsePeriod,
  parseReferenceDate,
} from "@/lib/search-params";

export const metadata = { title: "Analítica — Nexto" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const period = parsePeriod(searchParams);
  const reference = parseReferenceDate(searchParams);
  const referenceDate = fromDateKey(reference);

  const range = rangeForPeriod(period, referenceDate);
  const previousRange = previousRangeForPeriod(period, referenceDate);
  const bucket = bucketForPeriod(period);

  const [totals, previousTotals, spending, incomeVsExpense, balance] =
    await Promise.all([
      getPeriodTotals(range),
      getPeriodTotals(previousRange),
      getSpendingByCategory(range),
      getIncomeVsExpense(range, bucket),
      getBalanceEvolution(range, bucket),
    ]);

  return (
    <>
      <PageHeader
        title="Analítica"
        description="Cómo se reparte tu gasto, cómo evoluciona tu saldo y cómo se comparan ingresos y gastos."
      />

      <PeriodPicker period={period} reference={reference} />

      <div className="space-y-4">
        <KpiGrid totals={totals} previousTotals={previousTotals} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Gasto por categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <SpendingDonut data={spending} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ingresos vs. gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <IncomeExpenseBars data={incomeVsExpense} bucket={bucket} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolución del saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceLine data={balance} bucket={bucket} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
