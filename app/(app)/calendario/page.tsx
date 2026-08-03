import { CalendarDays } from "lucide-react";

import { CalendarView } from "@/components/calendar/calendar-view";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { calendarGridRange, formatDateLong, fromDateKey } from "@/lib/dates";
import { getAccountOptions } from "@/lib/queries/accounts";
import { getCategoryOptions } from "@/lib/queries/categories";
import { getDailyNetBalance } from "@/lib/queries/analytics";
import { getTransactionsForDay } from "@/lib/queries/transactions";
import {
  type SearchParams,
  firstParam,
  parseReferenceDate,
} from "@/lib/search-params";

export const metadata = { title: "Calendario — Nexto" };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const month = parseReferenceDate(searchParams, "mes");
  const rawDay = firstParam(searchParams, "dia");
  const selectedDay = rawDay && ISO_DATE.test(rawDay) ? rawDay : null;

  // Se pide exactamente el rango visible de la grilla (semanas completas),
  // agregado en Postgres con el índice (user_id, date).
  const gridRange = calendarGridRange(fromDateKey(month));

  const [days, accounts, categories, dayTransactions] = await Promise.all([
    getDailyNetBalance(gridRange),
    getAccountOptions(),
    getCategoryOptions(),
    selectedDay ? getTransactionsForDay(selectedDay) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Calendario"
        description="Balance neto de cada día. Haz clic en un día para ver sus movimientos."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <CalendarView month={month} days={days} selectedDay={selectedDay} />

        <Card className="xl:sticky xl:top-20 xl:h-fit">
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-base">
              {selectedDay
                ? formatDateLong(fromDateKey(selectedDay))
                : "Detalle del día"}
            </CardTitle>
            {selectedDay ? (
              <TransactionFormDialog
                accounts={accounts}
                categories={categories}
                defaultDate={selectedDay}
                trigger={
                  <button
                    type="button"
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    Añadir
                  </button>
                }
              />
            ) : null}
          </CardHeader>

          <CardContent>
            {selectedDay ? (
              <TransactionList
                transactions={dayTransactions}
                accounts={accounts}
                categories={categories}
                emptyDescription="Ese día no tuvo movimientos."
              />
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="Ningún día seleccionado"
                description="Haz clic en una celda del calendario para ver sus transacciones."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

