"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { patientsTable } from "@/db/schema";

import PatientsTableActions from "./table-actions";

type Patient = typeof patientsTable.$inferSelect;

export const patientsTableColumns: ColumnDef<Patient>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Nome",
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "phoneNumber",
    accessorKey: "phoneNumber",
    header: "Telefone",
    cell: (params) => {
      const patient = params.row.original;
      const phoneNumber = patient.phoneNumber;
      if (!phoneNumber) return "";
      // Assumindo que o phoneNumber do paciente é formatado como (XX) XXXXX-XXXX
      const formatted = phoneNumber.replace(
        /(\d{2})(\d{5})(\d{4})/,
        "($1) $2-$3",
      );
      return formatted;
    },
  },
  {
    id: "cpf",
    accessorKey: "cpf",
    header: "CPF",
    cell: (params) => {
      const patient = params.row.original;
      const cpf = patient.cpf;
      if (!cpf) return "";
      // Formata CPF: ###.###.###-##
      const formatted = cpf.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        "$1.$2.$3-$4",
      );
      return formatted;
    },
  },
  {
    id: "dateOfBirth",
    accessorKey: "dateOfBirth",
    header: "Nascimento",
    cell: (params) => {
      const patient = params.row.original;
      // O Drizzle retorna date como string, vamos convertê-lo
      return format(new Date(patient.dateOfBirth), "dd/MM/yyyy", {
        locale: ptBR,
      });
    },
  },
  {
    id: "sex",
    accessorKey: "sex",
    header: "Sexo",
    cell: (params) => {
      const patient = params.row.original;
      return patient.sex === "male" ? "Masculino" : "Feminino";
    },
  },
  {
    id: "actions",
    cell: (params) => {
      const patient = params.row.original;
      return <PatientsTableActions patient={patient} />;
    },
  },
];
