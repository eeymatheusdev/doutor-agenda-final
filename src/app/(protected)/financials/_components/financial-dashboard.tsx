"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getClinicFinanceSummary,
  getClinicTransactions,
} from "@/actions/clinic-finances";

import AddFinanceEntryButton from "./add-finance-entry-button";
import FinanceCard from "./finance-card";
import FinancialsTable from "./financials-table";

interface FinancialDashboardProps {
  clinicId: string;
}

export default function FinancialDashboard({
  clinicId,
}: FinancialDashboardProps) {
  const { data: summary } = useQuery({
    queryKey: ["clinic-finance-summary", clinicId],
    queryFn: () => getClinicFinanceSummary(),
  });

  const { data: transactions } = useQuery({
    queryKey: ["clinic-transactions", clinicId],
    queryFn: () => getClinicTransactions({ clinicId }),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <FinanceCard
          title="Receita Total"
          amount={summary?.data?.totalRevenue ?? 0}
        />
        <FinanceCard
          title="Despesas Totais"
          amount={summary?.data?.totalExpense ?? 0}
        />
        <FinanceCard
          title="Saldo Líquido"
          amount={summary?.data?.netBalance ?? 0}
        />
        <FinanceCard
          title="Inadimplência"
          amount={summary?.data?.totalPatientDebt ?? 0}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Transações</h2>
        <AddFinanceEntryButton />
      </div>

      <FinancialsTable data={transactions?.data ?? []} />
    </div>
  );
}
