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
import { doctorsTable, patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import OdontogramCanvas from "../../_components/odontogram/odontogram-canvas";
import OdontogramHistory from "../../_components/odontogram/odontogram-history"; // Importação do novo componente

interface Props {
  params: { patientId: string };
}

export default async function OdontogramPage({ params }: Props) {
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
  const patientPromise = db.query.patientsTable.findFirst({
    where: eq(patientsTable.id, params.patientId),
  });

  // Busca a lista de médicos da clínica para o formulário
  const doctorsPromise = db.query.doctorsTable.findMany({
    where: eq(doctorsTable.clinicId, session.user.clinic.id),
    columns: {
      id: true,
      name: true,
      specialties: true,
    },
  });

  const [patient, doctors] = await Promise.all([
    patientPromise,
    doctorsPromise,
  ]);

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
        {/* Layout em 2 colunas para exibir o canvas e o histórico */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          {/* Odontograma Principal */}
          <OdontogramCanvas patientId={params.patientId} doctors={doctors} />
          {/* Histórico/Listagem de Registros */}
          <OdontogramHistory patientId={params.patientId} doctors={doctors} />
        </div>
      </PageContent>
    </PageContainer>
  );
}
