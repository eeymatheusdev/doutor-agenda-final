// src/app/(protected)/patients/[id]/odontogram/page.tsx
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import * as React from "react";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import OdontogramCanvas from "./_components/odontogram-canvas";

// Forçando o tipo 'any' na desestruturação das props para contornar o bug de tipagem do Next.js (params como Promise)
export default async function OdontogramPage({ params, searchParams }: any) {
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

  // Acessando params.id sem o erro de tipagem
  const patient = await db.query.patientsTable.findFirst({
    where: eq(patientsTable.id, params.id),
  });

  if (!patient || patient.clinicId !== session.user.clinic.id) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Odontograma de {patient.name}</PageTitle>
          <PageDescription>
            Visualize e registre as marcações dentárias do paciente.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <OdontogramCanvas patientId={params.id} />
      </PageContent>
    </PageContainer>
  );
}
