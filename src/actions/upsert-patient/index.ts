// src/actions/upsert-patient/index.ts - Conteúdo inalterado
"use server";

import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = actionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    const formattedDateOfBirth = parsedInput.dateOfBirth
      ? dayjs(parsedInput.dateOfBirth).format("YYYY-MM-DD")
      : "";

    await db
      .insert(patientsTable)
      .values({
        ...parsedInput,
        dateOfBirth: formattedDateOfBirth,
        clinicId: session.user.clinic.id,
      })
      .onConflictDoUpdate({
        target: [patientsTable.id],
        set: {
          ...parsedInput,
          dateOfBirth: formattedDateOfBirth,
        },
      });

    revalidatePath("/patients");
  });
