import dayjs from "dayjs";
import { and, eq, gte, lte } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
import {
  appointmentsTable,
  appointmentStatusEnum,
  doctorsTable,
  patientsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

import AddAppointmentButton from "./_components/add-appointment-button";
import { AppointmentsDataTable } from "./_components/appointments-data-table";
import { AppointmentsTableFilters } from "./_components/appointments-table-filters";
import { AppointmentWithRelations } from "./_components/table-columns";

interface AppointmentsPageProps {
  searchParams: Promise<{
    status?: (typeof appointmentStatusEnum.enumValues)[number];
    date?: string;
  }>;
}

const AppointmentsPage = async ({ searchParams }: AppointmentsPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic");
  }
  if (!session.user.plan) {
    redirect("/new-subscription");
  }

  const resolvedSearchParams = await searchParams;
  const { status, date } = resolvedSearchParams;
  const filterDate = date ? dayjs(date).toDate() : new Date();
  const filterStatus = status || "agendada";

  const [patients, doctors, appointments] = await Promise.all([
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, session.user.clinic.id),
    }),
    db.query.doctorsTable.findMany({
      where: eq(doctorsTable.clinicId, session.user.clinic.id),
    }),
    db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        eq(appointmentsTable.status, filterStatus),
        gte(
          appointmentsTable.appointmentDateTime,
          dayjs(filterDate).startOf("day").toDate(),
        ),
        lte(
          appointmentsTable.appointmentDateTime,
          dayjs(filterDate).endOf("day").toDate(),
        ),
      ),
      with: {
        patient: true,
        doctor: true,
      },
    }),
  ]);

  const adaptedAppointments = appointments.map((appointment) => ({
    ...appointment,
    doctor: {
      ...appointment.doctor,
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
        <AppointmentsTableFilters
          defaultStatus={filterStatus}
          defaultDate={filterDate}
        />
        <AppointmentsDataTable
          data={adaptedAppointments}
          patients={patients}
          doctors={doctors}
        />
      </PageContent>
    </PageContainer>
  );
};

export default AppointmentsPage;
