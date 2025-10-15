"use client";

import { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { DataTable } from "@/components/ui/data-table";
import { doctorsTable, patientsTable } from "@/db/schema";

import AppointmentsTableActions from "./table-actions";
import {
  appointmentsTableColumns,
  AppointmentWithRelations,
} from "./table-columns";

interface AppointmentsDataTableProps {
  data: AppointmentWithRelations[];
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}

export function AppointmentsDataTable({
  data,
  patients,
  doctors,
}: AppointmentsDataTableProps) {
  const columns: ColumnDef<AppointmentWithRelations>[] = React.useMemo(() => {
    return appointmentsTableColumns.map((column) => {
      if (column.id === "actions") {
        return {
          ...column,
          cell: ({ row }: { row: { original: AppointmentWithRelations } }) => (
            <AppointmentsTableActions
              appointment={row.original}
              patients={patients}
              doctors={doctors}
            />
          ),
        };
      }
      return column;
    });
  }, [patients, doctors]);

  return <DataTable data={data} columns={columns} />;
}
