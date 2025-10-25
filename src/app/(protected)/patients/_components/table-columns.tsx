// src/app/(protected)/patients/_components/table-columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importa o helper para cabeçalhos ordenáveis
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { patientsTable } from "@/db/schema";

import PatientsTableActions from "./table-actions";

type Patient = typeof patientsTable.$inferSelect;

export const patientsTableColumns: ColumnDef<Patient>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    cell: ({ row }) => row.original.name,
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => row.original.email,
    enableSorting: true,
  },
  {
    accessorKey: "phoneNumber",
    header: "Telefone",
    cell: ({ row }) => {
      const patient = row.original;
      const phoneNumber = patient.phoneNumber;
      if (!phoneNumber) return "-";
      // Formata (XX) XXXXX-XXXX
      const cleaned = phoneNumber.replace(/\D/g, "");
      if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
      }
      return phoneNumber; // Retorna original se não for formato esperado
    },
    enableSorting: false, // Geralmente não se ordena por telefone formatado
  },
  {
    accessorKey: "cpf",
    header: "CPF",
    cell: ({ row }) => {
      const patient = row.original;
      const cpf = patient.cpf;
      if (!cpf) return "-";
      // Formata ###.###.###-##
      const cleaned = cpf.replace(/\D/g, "");
      if (cleaned.length === 11) {
        return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
      }
      return cpf; // Retorna original se não for formato esperado
    },
    enableSorting: false, // Ordenar por CPF pode não ser usual
  },
  {
    accessorKey: "dateOfBirth",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nascimento" />
    ),
    cell: ({ row }) => {
      const patient = row.original;
      try {
        // O Drizzle retorna date como string
        return format(new Date(patient.dateOfBirth), "dd/MM/yyyy", {
          locale: ptBR,
        });
      } catch (e) {
        return "-"; // Retorna "-" se a data for inválida
      }
    },
    enableSorting: true,
  },
  {
    accessorKey: "sex",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sexo" />
    ),
    cell: ({ row }) => {
      const patient = row.original;
      return patient.sex === "male" ? "Masculino" : "Feminino";
    },
    enableSorting: true,
  },
  {
    accessorKey: "financialStatus", // Adiciona coluna para Status Financeiro
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status Financeiro" />
    ),
    cell: ({ row }) => {
      const status = row.original.financialStatus;
      return status === "inadimplente" ? "Inadimplente" : "Adimplente";
    },
    enableSorting: true,
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const patient = row.original;
      return <PatientsTableActions patient={patient} />;
    },
    enableSorting: false,
  },
];
