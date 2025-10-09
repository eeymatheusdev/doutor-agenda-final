"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { clinicFinancesTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";

import FinancialsTableActions from "./table-actions";

type Transaction = typeof clinicFinancesTable.$inferSelect & {
  patient: { name: string } | null;
  doctor: { name: string } | null;
};

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.original.type;
      const typeMap = {
        revenue: "Receita",
        expense: "Despesa",
        payment_doctor: "Pag. Médico",
        commission: "Comissão",
      };
      return typeMap[type] || type;
    },
  },
  {
    accessorKey: "category",
    header: "Categoria",
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => formatCurrencyInCents(Number(row.original.amount) * 100),
  },
  {
    accessorKey: "patient.name",
    header: "Paciente",
    cell: ({ row }) => row.original.patient?.name ?? "-",
  },
  {
    accessorKey: "doctor.name",
    header: "Médico",
    cell: ({ row }) => row.original.doctor?.name ?? "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : "-";
    },
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
    id: "actions",
    cell: ({ row }) => <FinancialsTableActions transaction={row.original} />,
  },
];
