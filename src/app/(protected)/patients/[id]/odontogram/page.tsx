// @ts-nocheck

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

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function OdontogramPage({
  params,
  searchParams,
}: PageProps) {
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
