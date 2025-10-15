import dayjs from "dayjs";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";

interface Params {
  from: string;
  to: string;
  session: {
    user: {
      clinic: {
        id: string;
      };
    };
  };
}

export const getDashboard = async ({ from, to, session }: Params) => {
  const chartStartDate = dayjs().subtract(10, "days").startOf("day").toDate();
  const chartEndDate = dayjs().add(10, "days").endOf("day").toDate();
  const [
    [totalAppointments],
    [totalPatients],
    [totalDoctors],
    topDoctors,
    topSpecialties,
    todayAppointments,
    dailyAppointmentsData,
    patients,
    doctors,
  ] = await Promise.all([
    db
      .select({
        total: count(),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.appointmentDateTime, new Date(from)),
          lte(appointmentsTable.appointmentDateTime, new Date(to)),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(eq(patientsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        total: count(),
      })
      .from(doctorsTable)
      .where(eq(doctorsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        id: doctorsTable.id,
        name: doctorsTable.name,
        avatarImageUrl: doctorsTable.avatarImageUrl,
        // Usando o primeiro elemento do array como 'specialty'
        specialty: sql<string>`${doctorsTable.specialties}[1]`.as("specialty"),
        appointments: count(appointmentsTable.id),
      })
      .from(doctorsTable)
      .leftJoin(
        appointmentsTable,
        and(
          eq(appointmentsTable.doctorId, doctorsTable.id),
          gte(appointmentsTable.appointmentDateTime, new Date(from)),
          lte(appointmentsTable.appointmentDateTime, new Date(to)),
        ),
      )
      .where(eq(doctorsTable.clinicId, session.user.clinic.id))
      .groupBy(doctorsTable.id, sql`${doctorsTable.specialties}[1]`)
      .orderBy(desc(count(appointmentsTable.id)))
      .limit(10),
    db
      .select({
        // UNNEST transforma o array de specialties em múltiplas linhas
        specialty: sql<string>`unnest(${doctorsTable.specialties})`.as(
          "specialty",
        ),
        appointments: count(appointmentsTable.id),
      })
      .from(appointmentsTable)
      .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.appointmentDateTime, new Date(from)),
          lte(appointmentsTable.appointmentDateTime, new Date(to)),
        ),
      )
      .groupBy(sql`unnest(${doctorsTable.specialties})`)
      .orderBy(desc(count(appointmentsTable.id))),
    db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        gte(
          appointmentsTable.appointmentDateTime,
          dayjs().startOf("day").toDate(),
        ),
        lte(
          appointmentsTable.appointmentDateTime,
          dayjs().endOf("day").toDate(),
        ),
      ),
      with: {
        patient: true,
        doctor: true, // Retorna o objeto doctor completo, incluindo 'specialties' (array)
      },
    }),
    db
      .select({
        date: sql<string>`DATE(${appointmentsTable.appointmentDateTime})`.as(
          "date",
        ),
        appointments: count(appointmentsTable.id),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.appointmentDateTime, chartStartDate),
          lte(appointmentsTable.appointmentDateTime, chartEndDate),
        ),
      )
      .groupBy(sql`DATE(${appointmentsTable.appointmentDateTime})`)
      .orderBy(sql`DATE(${appointmentsTable.appointmentDateTime})`),
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, session.user.clinic.id),
    }),
    db.query.doctorsTable.findMany({
      where: eq(doctorsTable.clinicId, session.user.clinic.id),
    }),
  ]);

  const adaptedTodayAppointments = todayAppointments.map((a) => ({
    ...a,
    doctor: {
      ...a.doctor,
      // Mapeia o campo `specialty` para a primeira especialidade do array para compatibilidade com a coluna da tabela
      specialty: a.doctor.specialties[0] ?? "Sem especialidade",
    },
  }));

  return {
    totalAppointments,
    totalPatients,
    totalDoctors,
    topDoctors: topDoctors as any,
    topSpecialties: topSpecialties as any,
    todayAppointments: adaptedTodayAppointments,
    dailyAppointmentsData,
    patients,
    doctors,
  };
};
