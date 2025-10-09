"use client";

import { DataTable } from "@/components/ui/data-table";
import { clinicFinancesTable } from "@/db/schema";

import { columns } from "./table-columns";

type Transaction = typeof clinicFinancesTable.$inferSelect & {
  patient: { name: string } | null;
  doctor: { name: string } | null;
};

interface FinancialsTableProps {
  data: Transaction[];
}

export default function FinancialsTable({ data }: FinancialsTableProps) {
  return <DataTable columns={columns} data={data} />;
}
