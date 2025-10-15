"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

import AppointmentsTableActions from "./table-actions";

export type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    sex: "male" | "female";
  };
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
};

export const appointmentsTableColumns: ColumnDef<AppointmentWithRelations>[] = [
  {
    id: "patient",
    accessorKey: "patient.name",
    header: "Paciente",
  },
  {
    id: "doctor",
    accessorKey: "doctor.name",
    header: "Médico",
    cell: (params) => {
      const appointment = params.row.original;
      return `${appointment.doctor.name}`;
    },
  },
  {
    id: "appointmentDateTime",
    accessorKey: "appointmentDateTime",
    header: "Data e Hora",
    cell: (params) => {
      const appointment = params.row.original;
      return format(
        new Date(appointment.appointmentDateTime),
        "dd/MM/yyyy 'às' HH:mm",
        {
          locale: ptBR,
        },
      );
    },
  },
  {
    id: "procedure",
    accessorKey: "procedure",
    header: "Procedimento",
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: (params) => {
      const status = params.row.original.status;
      return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
    },
  },
  {
    id: "actions",
    cell: (params) => {
      const appointment = params.row.original;
      // Esta parte será sobrescrita na `page.tsx` para passar os props necessários
      return (
        <AppointmentsTableActions
          appointment={appointment}
          patients={[]}
          doctors={[]}
        />
      );
    },
  },
];
