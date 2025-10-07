// src/app/(protected)/doctors/_helpers/availability.ts
import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { doctorsTable } from "@/db/schema";

dayjs.extend(utc);
dayjs.locale("pt-br");

// Define um tipo que inclui apenas os campos de disponibilidade necessários
type DoctorAvailabilityFields = Pick<
  typeof doctorsTable.$inferSelect,
  | "availableFromTime"
  | "availableToTime"
  | "availableFromWeekDay"
  | "availableToWeekDay"
>;

// O tipo de entrada agora é mais permissivo e compatível com a interface 'Doctor'
export const getAvailability = (doctor: DoctorAvailabilityFields) => {
  const from = dayjs()
    .utc()
    .day(doctor.availableFromWeekDay)
    .set("hour", Number(doctor.availableFromTime.split(":")[0]))
    .set("minute", Number(doctor.availableFromTime.split(":")[1]))
    .set("second", Number(doctor.availableFromTime.split(":")[2] || 0))
    .local();
  const to = dayjs()
    .utc()
    .day(doctor.availableToWeekDay)
    .set("hour", Number(doctor.availableToTime.split(":")[0]))
    .set("minute", Number(doctor.availableToTime.split(":")[1]))
    .set("second", Number(doctor.availableToTime.split(":")[2] || 0))
    .local();
  return { from, to };
};
