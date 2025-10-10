import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getPatientById } from "@/actions/patients/get-by-id";
import { PageContainer, PageContent } from "@/components/ui/page-container";
import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import { PatientHeader } from "./_components/patient-header";
import { PatientTabs } from "./_components/patient-tabs";

interface Props {
  params: Promise<{ patientId: string }>;
}

export default async function PatientDetailPage({
  params: paramsPromise,
}: Props) {
  const params = await paramsPromise;
  const patientId = params.patientId;
  const session = await auth.api.getSession({ headers: await headers() });

  const patientResult = await getPatientById({ patientId });

  if (!patientResult || !patientResult.data) {
    notFound();
  }

  const doctors = await db.query.doctorsTable.findMany({
    where: eq(doctorsTable.clinicId, session!.user.clinic!.id),
    columns: {
      id: true,
      name: true,
      specialties: true,
    },
  });

  return (
    <PageContainer>
      <PatientHeader patient={patientResult.data} />
      <PageContent>
        <PatientTabs patientId={patientId} doctors={doctors} />
      </PageContent>
    </PageContainer>
  );
}
