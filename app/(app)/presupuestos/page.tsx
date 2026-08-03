import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { type BudgetGroup, BudgetsView } from "@/components/budgets/budgets-view";
import { PageHeader } from "@/components/ui/page-header";
import { BUDGET_PERIODS } from "@/lib/constants";
import { formatRange } from "@/lib/dates";
import { getBudgetUsage } from "@/lib/queries/analytics";
import { budgetWindow, getBudgets } from "@/lib/queries/budgets";
import { getCategoryOptions } from "@/lib/queries/categories";

export const metadata = { title: "Presupuestos — Nexto" };

export default async function BudgetsPage() {
  const now = new Date();

  // Cada periodo tiene su propia ventana vigente (semana / mes / año actual).
  const windows = BUDGET_PERIODS.map((period) => ({
    period,
    range: budgetWindow(period, now),
  }));

  const [categories, budgets, ...usages] = await Promise.all([
    getCategoryOptions(),
    getBudgets(),
    ...windows.map(({ period, range }) => getBudgetUsage(period, range)),
  ]);

  const groups: BudgetGroup[] = windows.map((window, index) => ({
    period: window.period,
    windowLabel: formatRange(window.range),
    usage: usages[index] ?? [],
  }));

  return (
    <>
      <PageHeader
        title="Presupuestos"
        description="Límite de gasto por categoría, con alerta visual al acercarte o superarlo."
        action={
          budgets.length > 0 ? (
            <BudgetFormDialog categories={categories} />
          ) : undefined
        }
      />
      <BudgetsView groups={groups} budgets={budgets} categories={categories} />
    </>
  );
}
