// src/actions/clinic/get-clinic.ts - CORRIGIDO
"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { DentalSpecialty } from "@/app/(protected)/doctors/_constants"; // Importa o tipo correto
import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getClinic = actionClient.action(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !session.user.clinic?.id) {
    throw new Error("Não autorizado ou clínica não encontrada");
  }

  const clinic = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.id, session.user.clinic.id),
  });

  if (!clinic) {
    throw new Error("Clínica não encontrada.");
  }

  // CORREÇÃO: Usa o tipo literal DentalSpecialty no predicado.
  // Isso resolve o erro de tipagem.
  const cleanedSpecialties =
    clinic.specialties?.filter((s): s is DentalSpecialty => !!s) ?? [];

  return {
    ...clinic,
    specialties: cleanedSpecialties,
  };
});
