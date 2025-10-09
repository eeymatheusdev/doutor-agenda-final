"use server";

import dayjs from "dayjs"; // Import dayjs
import { and, eq, sql, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import {
  clinicFinancesTable,
  doctorFinancesTable,
  patientFinancesTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { clinicFinanceSchema } from "./schema";

export const getClinicFinanceSummary = actionClient.action(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.clinic?.id) {
    throw new Error("Não autorizado ou clínica não encontrada.");
  }
  const clinicId = session.user.clinic.id;

  const [revenue] = await db
    .select({ total: sum(clinicFinancesTable.amount) })
    .from(clinicFinancesTable)
    .where(
      and(
        eq(clinicFinancesTable.clinicId, clinicId),
        eq(clinicFinancesTable.type, "revenue"),
        eq(clinicFinancesTable.status, "paid"),
      ),
    );

  const [expense] = await db
    .select({ total: sum(clinicFinancesTable.amount) })
    .from(clinicFinancesTable)
    .where(
      and(
        eq(clinicFinancesTable.clinicId, clinicId),
        eq(clinicFinancesTable.type, "expense"),
      ),
    );

  const [patientDebts] = await db
    .select({
      total: sql<number>`SUM(CASE WHEN type = 'charge' THEN "amountInCents" ELSE -"amountInCents" END) / 100`,
    })
    .from(patientFinancesTable)
    .where(eq(patientFinancesTable.clinicId, clinicId));

  const [doctorCommissions] = await db
    .select({ total: sum(doctorFinancesTable.amountInCents) })
    .from(doctorFinancesTable)
    .where(
      and(
        eq(doctorFinancesTable.clinicId, clinicId),
        eq(doctorFinancesTable.type, "commission"),
        eq(doctorFinancesTable.status, "pending"),
      ),
    );

  const totalRevenue = Number(revenue?.total) || 0;
  const totalExpense = Number(expense?.total) || 0;
  const netBalance = totalRevenue - totalExpense;

  return {
    totalRevenue,
    totalExpense,
    netBalance,
    totalPatientDebt: Number(patientDebts?.total) || 0,
    totalDoctorDebt: Number(doctorCommissions?.total) / 100 || 0,
  };
});

export const getClinicTransactions = actionClient
  .schema(z.object({ clinicId: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user?.clinic?.id !== parsedInput.clinicId) {
      throw new Error("Não autorizado");
    }

    return db.query.clinicFinancesTable.findMany({
      where: eq(clinicFinancesTable.clinicId, parsedInput.clinicId),
      with: {
        patient: { columns: { name: true } },
        doctor: { columns: { name: true } },
      },
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
  });

export const upsertClinicFinance = actionClient
  .schema(clinicFinanceSchema.extend({ id: z.number().optional() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.clinic?.id) {
      throw new Error("Não autorizado ou clínica não encontrada.");
    }

    const { id, amount, dueDate, ...data } = parsedInput;

    const values = {
      ...data,
      amount: String(amount),
      // CORREÇÃO: Formata a data para string 'YYYY-MM-DD' ou a mantém como nula
      dueDate: dueDate ? dayjs(dueDate).format("YYYY-MM-DD") : null,
      clinicId: session.user.clinic.id,
    };

    if (id) {
      await db
        .update(clinicFinancesTable)
        .set(values)
        .where(eq(clinicFinancesTable.id, id));
    } else {
      await db.insert(clinicFinancesTable).values(values);
    }

    revalidatePath("/financials");
  });

export const deleteClinicFinance = actionClient
  .schema(z.object({ id: z.number() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.clinic?.id) {
      throw new Error("Não autorizado ou clínica não encontrada.");
    }

    await db
      .delete(clinicFinancesTable)
      .where(
        and(
          eq(clinicFinancesTable.id, parsedInput.id),
          eq(clinicFinancesTable.clinicId, session.user.clinic.id),
        ),
      );

    revalidatePath("/financials");
  });
