import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import {
  TransactionList,
  TransactionTotals,
} from "@/components/transactions/transaction-list";
import { PageHeader } from "@/components/ui/page-header";
import { fromDateKey, rangeForPeriod } from "@/lib/dates";
import { getAccountOptions } from "@/lib/queries/accounts";
import { getCategoryOptions } from "@/lib/queries/categories";
import { getTransactions } from "@/lib/queries/transactions";
import {
  type SearchParams,
  firstParam,
  parsePeriod,
  parseReferenceDate,
  parseTransactionType,
  parseUuid,
} from "@/lib/search-params";

export const metadata = { title: "Transacciones — Nexto" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const period = parsePeriod(searchParams);
  const reference = parseReferenceDate(searchParams);
  const accountId = parseUuid(searchParams, "cuenta");
  const categoryId = parseUuid(searchParams, "categoria");
  const type = parseTransactionType(searchParams);
  const openNew = firstParam(searchParams, "nueva") === "1";

  const range = rangeForPeriod(period, fromDateKey(reference));

  const [accounts, categories, transactions] = await Promise.all([
    getAccountOptions(),
    getCategoryOptions(),
    getTransactions({ range, accountId, categoryId, type }),
  ]);

  return (
    <>
      <PageHeader
        title="Transacciones"
        description="Registra ingresos y gastos, y fíltralos por periodo, cuenta o categoría."
        action={
          <TransactionFormDialog
            accounts={accounts}
            categories={categories}
            defaultOpen={openNew}
          />
        }
      />

      <TransactionFilters
        period={period}
        reference={reference}
        accountId={accountId}
        categoryId={categoryId}
        type={type}
        accounts={accounts}
        categories={categories}
      />

      <div className="space-y-4">
        <TransactionTotals transactions={transactions} />
        <div className="rounded-lg border border-border bg-card">
          <TransactionList
            transactions={transactions}
            accounts={accounts}
            categories={categories}
          />
        </div>
      </div>
    </>
  );
}
