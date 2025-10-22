// src/app/(protected)/financials/_components/table-columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  clinicFinancesTable,
  employeesTable, // Keep employeesTable
  patientsTable,
  usersTable,
} from "@/db/schema"; // Importar tabelas relacionadas
import { formatCurrencyInCents } from "@/helpers/currency";
import { cn } from "@/lib/utils"; // Importar cn

// CORRECTED IMPORT PATH
import {
  clinicFinancialOperations, // Import types
  ClinicFinancialStatus, // Keep unused type for consistency if desired
  clinicFinancialStatuses,
} from "../index"; // <-- Corrected path
import FinancialsTableActions from "./table-actions";

// Tipo expandido para incluir relações CORRIGIDO
type Transaction = typeof clinicFinancesTable.$inferSelect & {
  patient: Pick<typeof patientsTable.$inferSelect, "id" | "name"> | null;
  employee: Pick<typeof employeesTable.$inferSelect, "id" | "name"> | null; // Changed doctor to employee
  creator: Pick<typeof usersTable.$inferSelect, "id" | "name"> | null;
};

// Helper para obter label do status
const getStatusLabel = (
  statusValue:
    | (typeof clinicFinancialStatuses)[number]["value"]
    | null
    | undefined,
) => {
  return (
    clinicFinancialStatuses.find((s) => s.value === statusValue)?.label ??
    statusValue ??
    "-"
  );
};

// Helper para obter label da operação
const getOperationLabel = (
  opValue:
    | (typeof clinicFinancialOperations)[number]["value"]
    | null
    | undefined,
) => {
  return (
    clinicFinancialOperations.find((op) => op.value === opValue)?.label ??
    opValue ??
    "-"
  );
};

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "operation",
    header: "Operação",
    cell: ({ row }) => getOperationLabel(row.original.operation),
  },
  {
    accessorKey: "type", // Combina typeInput e typeOutput
    header: "Tipo",
    cell: ({ row }) => row.original.typeInput || row.original.typeOutput || "-",
  },
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "amountInCents",
    header: "Valor",
    cell: ({ row }) => {
      const amount = formatCurrencyInCents(row.original.amountInCents);
      const isOutput = row.original.operation === "output";
      return (
        <span className={cn(isOutput ? "text-destructive" : "text-green-600")}>
          {isOutput ? `- ${amount}` : `+ ${amount}`}
        </span>
      );
    },
  },
  {
    accessorKey: "relatedEntity", // Coluna combinada para Paciente ou Funcionário
    header: "Relacionado a",
    cell: ({ row }) =>
      row.original.patient?.name || row.original.employee?.name || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let colorClass = "";
      switch (status) {
        case "paid":
          colorClass = "text-green-600";
          break;
        case "pending":
          colorClass = "text-amber-600";
          break;
        case "overdue":
          colorClass = "text-destructive";
          break;
        case "refunded":
          colorClass = "text-gray-500 line-through";
          break;
      }
      return (
        <span className={cn("font-semibold", colorClass)}>
          {getStatusLabel(status)}
        </span>
      );
    },
  },
  {
    accessorKey: "paymentDate",
    header: "Data Pag./Rec.",
    cell: ({ row }) =>
      row.original.paymentDate
        ? format(new Date(row.original.paymentDate), "dd/MM/yyyy", {
            locale: ptBR,
          })
        : "-",
  },
  {
    accessorKey: "dueDate",
    header: "Vencimento",
    cell: ({ row }) =>
      row.original.dueDate
        ? format(new Date(row.original.dueDate), "dd/MM/yyyy", { locale: ptBR })
        : "-",
  },
  {
    accessorKey: "paymentMethod",
    header: "Forma Pag.",
    cell: ({ row }) => row.original.paymentMethod || "-",
  },
  {
    accessorKey: "createdAt",
    header: "Criado em",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "dd/MM/yy HH:mm", {
        locale: ptBR,
      }),
  },
  // { // Opcional: Mostrar quem criou
  //   accessorKey: "creator.name",
  //   header: "Criado por",
  //   cell: ({ row }) => row.original.creator?.name ?? "-",
  // },
  {
    id: "actions",
    // CORREÇÃO: Passar props corretas para FinancialsTableActions
    cell: ({ row, table }) => {
      // Acessar meta se disponível (assumindo que patients e employeesAndDoctors são passados via meta)
      const meta = table.options.meta as
        | {
            patients: { id: string; name: string }[];
            employeesAndDoctors: { id: string; name: string }[];
          }
        | undefined;
      return (
        <FinancialsTableActions
          transaction={row.original}
          patients={meta?.patients ?? []} // Usa dados do meta ou array vazio
          employeesAndDoctors={meta?.employeesAndDoctors ?? []} // Usa dados do meta ou array vazio
        />
      );
    },
  },
];

// Exporta o tipo corrigido se necessário em outros lugares
export type FinancialTransaction = Transaction;
