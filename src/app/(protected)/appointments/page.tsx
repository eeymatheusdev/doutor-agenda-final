import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";

import AddAppointmentButton from "./_components/add-appointment-button";
import {
  appointmentsTableColumns,
  AppointmentWithRelations, // Importação agora funciona
} from "./_components/table-columns";

const AppointmentsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }
  if (!session.user.plan) {
    redirect("/new-subscription");
  }
  const [patients, doctors, appointments] = await Promise.all([
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, session.user.clinic.id),
    }),
    db.query.doctorsTable.findMany({
      where: eq(doctorsTable.clinicId, session.user.clinic.id),
    }),
    db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.clinicId, session.user.clinic.id),
      with: {
        patient: true,
        doctor: true,
      },
    }),
  ]);

  // ADAPTAÇÃO: Mapeia os dados para incluir 'specialty' como string,
  // conforme exigido pelo tipo AppointmentWithRelations e colunas da tabela.
  const adaptedAppointments = appointments.map((appointment) => ({
    ...appointment,
    doctor: {
      ...appointment.doctor,
      // O Drizzle retorna 'specialties' como array, usamos o primeiro item.
      specialty: appointment.doctor.specialties[0] ?? "Sem especialidade",
    },
  })) as AppointmentWithRelations[];

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Agendamentos</PageTitle>
          <PageDescription>
            Gerencie os agendamentos da sua clínica
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddAppointmentButton patients={patients} doctors={doctors} />
        </PageActions>
      </PageHeader>
      <PageContent>
        {/* CORREÇÃO: Passa a lista de agendamentos adaptados */}
        <DataTable
          data={adaptedAppointments}
          columns={appointmentsTableColumns}
        />
      </PageContent>
    </PageContainer>
  );
};

export default AppointmentsPage;
