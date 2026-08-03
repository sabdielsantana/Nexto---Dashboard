import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { AccountsView } from "@/components/accounts/accounts-view";
import { PageHeader } from "@/components/ui/page-header";
import { getAccountsWithBalances } from "@/lib/queries/accounts";

export const metadata = { title: "Cuentas — Nexto" };

export default async function AccountsPage() {
  const accounts = await getAccountsWithBalances();

  return (
    <>
      <PageHeader
        title="Cuentas"
        description="Débito, crédito, efectivo, inversión y banca nacional."
        action={accounts.length > 0 ? <AccountFormDialog /> : undefined}
      />
      <AccountsView accounts={accounts} />
    </>
  );
}
