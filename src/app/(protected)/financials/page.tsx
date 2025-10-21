// src/app/(protected)/financials/page.tsx
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React, { Suspense } from "react"; // Import Suspense

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { Skeleton } from "@/components/ui/skeleton"; // For Suspense fallback
import { db } from "@/db";
import { doctorsTable, employeesTable, patientsTable } from "@/db/schema"; // Import necessary tables
import { auth } from "@/lib/auth";

import FinancialDashboard from "./_components/financial-dashboard";
import { FinancialsFilters } from "./_components/financials-filters";

// Define the expected search param types
interface FinancialsPageSearchParams {
  from?: string;
  to?: string;
  status?: string; // Add other filters if needed
  operation?: string;
}

interface FinancialsPageProps {
  searchParams: FinancialsPageSearchParams; // Use the defined interface
}

export default async function FinancialsPage({
  searchParams,
}: FinancialsPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic) redirect("/clinic");
  if (!session.user.plan) redirect("/new-subscription");

  const clinicId = session.user.clinic.id;

  // Fetch data needed for filters/forms concurrently
  const [patients, employees, doctors] = await Promise.all([
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, clinicId),
      columns: { id: true, name: true }, // Select only needed columns
    }),
    db.query.employeesTable.findMany({
      where: eq(employeesTable.clinicId, clinicId),
      columns: { id: true, name: true }, // Select only needed columns
    }),
    db.query.doctorsTable.findMany({
      // Fetch doctors separately if they are not in employees table for payments
      where: eq(doctorsTable.clinicId, clinicId),
      columns: { id: true, name: true }, // Select only needed columns
    }),
  ]);

  // Combine employees and doctors for the payment select
  const employeesAndDoctors = [
    ...employees.map((e) => ({ id: e.id, name: e.name })),
    ...doctors.map((d) => ({ id: d.id, name: `${d.name} (Médico)` })), // Add identifier for doctors if needed
  ].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

  // Extract filter values from searchParams, providing defaults
  const from =
    searchParams.from ?? dayjs().startOf("month").format("YYYY-MM-DD");
  const to = searchParams.to ?? dayjs().endOf("month").format("YYYY-MM-DD");
  const status = searchParams.status;
  const operation = searchParams.operation;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Financeiro da Clínica</PageTitle>
          <PageDescription>
            Acompanhe as receitas, despesas e o balanço geral da sua clínica.
          </PageDescription>
        </PageHeaderContent>
        {/* Actions can be added here if needed */}
      </PageHeader>
      <PageContent>
        {/* Wrap Filters and Dashboard in Suspense for better UX */}
        <Suspense fallback={<Skeleton className="mb-4 h-16 w-full" />}>
          <FinancialsFilters />
        </Suspense>
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          }
        >
          {/* Pass filter params and fetched data to Dashboard */}
          <FinancialDashboard
            clinicId={clinicId}
            filterParams={{ from, to, status, operation }}
            patients={patients}
            employeesAndDoctors={employeesAndDoctors}
          />
        </Suspense>
      </PageContent>
    </PageContainer>
  );
}
