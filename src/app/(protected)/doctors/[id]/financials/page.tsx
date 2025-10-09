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

export default async function DoctorFinancialsPage({ params }: any) {
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
