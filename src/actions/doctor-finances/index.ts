"use server";

import dayjs from "dayjs";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { doctorFinancesTable, doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertDoctorFinanceSchema } from "./schema";

async function updateDoctorFinancialStatus(doctorId: string, clinicId: string) {
  const [totals] = await db
    .select({
      pendingCommissions:
        sql<number>`COALESCE(SUM(CASE WHEN type = 'commission' AND status = 'pending' THEN 1 ELSE 0 END), 0)`.as(
          "pending_commissions",
        ),
      overdueCommissions:
        sql<number>`COALESCE(SUM(CASE WHEN type = 'commission' AND status = 'pending' AND due_date < NOW() THEN 1 ELSE 0 END), 0)`.as(
          "overdue_commissions",
        ),
    })
    .from(doctorFinancesTable)
    .where(
      and(
        eq(doctorFinancesTable.doctorId, doctorId),
        eq(doctorFinancesTable.clinicId, clinicId),
      ),
    );

  revalidatePath(`/doctors/${doctorId}/financials`);
  revalidatePath(`/doctors`);
}

export const upsertDoctorFinance = actionClient
  .schema(upsertDoctorFinanceSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.clinic?.id) {
      throw new Error("Não autorizado ou clínica não encontrada.");
    }

    const { id, doctorId, ...data } = parsedInput;
    const clinicId = session.user.clinic.id;

    const formattedDueDate = data.dueDate
      ? dayjs(data.dueDate).format("YYYY-MM-DD")
      : null;

    const values = {
      ...data,
      dueDate: formattedDueDate,
      doctorId,
      clinicId,
      amountInCents: data.amount * 100,
    };

    if (id) {
      await db
        .update(doctorFinancesTable)
        .set(values)
        .where(
          and(
            eq(doctorFinancesTable.id, id),
            eq(doctorFinancesTable.clinicId, clinicId),
          ),
        );
    } else {
      await db.insert(doctorFinancesTable).values(values);
    }

    await updateDoctorFinancialStatus(doctorId, clinicId);

    return { success: true };
  });

export const deleteDoctorFinance = actionClient
  .schema(z.object({ id: z.number(), doctorId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.clinic?.id) {
      throw new Error("Não autorizado ou clínica não encontrada.");
    }

    const clinicId = session.user.clinic.id;
    const { id, doctorId } = parsedInput;

    await db
      .delete(doctorFinancesTable)
      .where(
        and(
          eq(doctorFinancesTable.id, id),
          eq(doctorFinancesTable.clinicId, clinicId),
        ),
      );

    await updateDoctorFinancialStatus(doctorId, clinicId);

    return { success: true };
  });

export const getDoctorFinances = actionClient
  .schema(z.object({ doctorId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.clinic?.id) {
      throw new Error("Não autorizado ou clínica não encontrada.");
    }

    const finances = await db.query.doctorFinancesTable.findMany({
      where: and(
        eq(doctorFinancesTable.doctorId, parsedInput.doctorId),
        eq(doctorFinancesTable.clinicId, session.user.clinic.id),
      ),
      orderBy: (finances, { desc }) => [desc(finances.createdAt)],
      with: {
        patient: {
          columns: {
            name: true,
          },
        },
      },
    });

    return finances;
  });
