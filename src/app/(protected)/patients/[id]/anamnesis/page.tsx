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

import AnamnesisCanvas from "./_components/anamnesis-canvas";
import AnamnesisHistory from "./_components/anamnesis-history";

// Forçando o tipo 'any' na desestruturação das props
export default async function AnamnesisPage({ params }: any) {
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
          <PageTitle>Ficha Clínica (Anamnese) de {patient.name}</PageTitle>
          <PageDescription>
            Crie, edite e visualize o histórico de anamneses do paciente.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <AnamnesisCanvas patientId={params.id} />
          <AnamnesisHistory patientId={params.id} />
        </div>
      </PageContent>
    </PageContainer>
  );
}
