"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DataTable } from "@/components/ui/data-table";
import { patientFinancesTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";

import FinancialsTableActions from "./financials-table-actions";

type FinanceEntry = typeof patientFinancesTable.$inferSelect;

interface FinancialsTableProps {
  data: FinanceEntry[];
  patientId: string;
}

const columns: ColumnDef<FinanceEntry>[] = [
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) =>
      row.original.type === "charge" ? "Cobrança" : "Pagamento",
  },
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "amountInCents",
    header: "Valor",
    cell: ({ row }) => formatCurrencyInCents(row.original.amountInCents),
  },
  {
    accessorKey: "method",
    header: "Método",
  },
  {
    accessorKey: "dueDate",
    header: "Vencimento",
    cell: ({ row }) =>
      row.original.dueDate
        ? format(new Date(row.original.dueDate), "dd/MM/yyyy", {
            locale: ptBR,
          })
        : "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      if (row.original.type === "payment") return "-";
      return row.original.status === "paid" ? "Pago" : "Pendente";
    },
  },
  {
    accessorKey: "createdAt",
    header: "Data",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      }),
  },
  {
    id: "actions",
    cell: ({ row }) => <FinancialsTableActions entry={row.original} />,
  },
];

export default function FinancialsTable({
  data,
  patientId,
}: FinancialsTableProps) {
  // Pass patientId para as actions
  const columnsWithActions = columns.map((col) => {
    if (col.id === "actions") {
      return {
        ...col,
        cell: ({ row }: { row: { original: FinanceEntry } }) => (
          <FinancialsTableActions entry={{ ...row.original, patientId }} />
        ),
      };
    }
    return col;
  });

  return <DataTable columns={columnsWithActions} data={data} />;
}
