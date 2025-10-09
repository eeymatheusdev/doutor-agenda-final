"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import * as React from "react";

import { getDoctorFinances } from "@/actions/doctor-finances";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { doctorFinancesTable, doctorsTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";

import AddFinanceEntryButton from "./add-finance-entry-button";
import FinancialsTable from "./financials-table";

// CORREÇÃO: O tipo agora inclui a relação com o paciente, assim como esperado pela tabela.
type FinanceEntry = typeof doctorFinancesTable.$inferSelect & {
  patient: { name: string } | null;
};
type Doctor = typeof doctorsTable.$inferSelect;

interface FinancialDashboardProps {
  doctor: Doctor;
  initialFinances: FinanceEntry[];
}

export default function FinancialDashboard({
  doctor,
  initialFinances,
}: FinancialDashboardProps) {
  const { data: finances = [] } = useQuery({
    queryKey: ["doctor-finances", doctor.id],
    queryFn: async () => {
      const result = await getDoctorFinances({ doctorId: doctor.id });
      return (result?.data as FinanceEntry[]) || [];
    },
    initialData: initialFinances,
  });

  const { totalCommissions, totalPayments, balance } = React.useMemo(() => {
    const totals = finances.reduce(
      (acc, entry) => {
        if (entry.type === "commission") {
          acc.totalCommissions += entry.amountInCents;
        } else if (entry.type === "payment") {
          acc.totalPayments += entry.amountInCents;
        }
        return acc;
      },
      { totalCommissions: 0, totalPayments: 0 },
    );
    return {
      ...totals,
      balance: totals.totalPayments - totals.totalCommissions,
    };
  }, [finances]);

  const getStatusBadgeVariant = (
    status: "adimplente" | "pendente" | "atrasado",
  ) => {
    switch (status) {
      case "adimplente":
        return "default";
      case "pendente":
        return "secondary";
      case "atrasado":
        return "destructive";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Resumo Financeiro</h2>
          <Badge
            variant={getStatusBadgeVariant(doctor.financialStatus)}
            className={
              doctor.financialStatus === "adimplente"
                ? "bg-green-500 hover:bg-green-600"
                : ""
            }
          >
            {doctor.financialStatus.charAt(0).toUpperCase() +
              doctor.financialStatus.slice(1)}
          </Badge>
        </div>
        <AddFinanceEntryButton doctorId={doctor.id} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Comissões
            </CardTitle>
            <TrendingDown className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyInCents(totalCommissions)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyInCents(totalPayments)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                balance < 0 ? "text-destructive" : "text-green-600"
              }`}
            >
              {formatCurrencyInCents(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <FinancialsTable data={finances} doctorId={doctor.id} />
    </div>
  );
}
