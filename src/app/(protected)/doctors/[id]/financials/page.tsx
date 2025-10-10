import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import * as React from "react";

import { getDoctorFinances } from "@/actions/doctor-finances";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import FinancialDashboard from "./_components/financial-dashboard";

// Interface para as props da página, tratando `params` como uma Promise
interface DoctorFinancialsPageProps {
  params: Promise<{ id: string }>;
}

export default async function DoctorFinancialsPage({
  params: paramsPromise,
}: DoctorFinancialsPageProps) {
  const params = await paramsPromise; // Resolve a Promise para obter o objeto de parâmetros
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }
  if (!session.user.plan) {
    redirect("/new-subscription");
  }

  const doctor = await db.query.doctorsTable.findFirst({
    where: and(
      eq(doctorsTable.id, params.id),
      eq(doctorsTable.clinicId, session.user.clinic.id),
    ),
  });

  if (!doctor) {
    notFound();
  }

  const initialFinances = await getDoctorFinances({ doctorId: params.id });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Financeiro de {doctor.name}</PageTitle>
          <PageDescription>
            Gerencie as comissões e pagamentos do médico.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <FinancialDashboard
          doctor={doctor}
          initialFinances={initialFinances?.data || []}
        />
      </PageContent>
    </PageContainer>
  );
}
