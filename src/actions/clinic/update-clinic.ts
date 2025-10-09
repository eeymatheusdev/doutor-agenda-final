// src/actions/clinic/update-clinic.ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { updateClinicSchema } from "./schema";

export const updateClinic = actionClient
  .schema(updateClinicSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !session.user.clinic?.id) {
      throw new Error("Não autorizado ou clínica não encontrada");
    }

    // Apenas o usuário associado à clínica pode editá-la.
    if (parsedInput.id !== session.user.clinic.id) {
      throw new Error("Você não tem permissão para editar esta clínica.");
    }

    // Função auxiliar para converter string vazia para null para campos opcionais
    const nullableString = (value: string | null | undefined) =>
      value === "" ? null : value;

    // Filtra campos indefinidos para evitar sobrescrever com undefined (drizzle-orm ignora undefined, mas o objeto base pode ter keys)
    const filteredInput = Object.fromEntries(
      Object.entries(parsedInput).filter(([, value]) => value !== undefined),
    );

    await db
      .update(clinicsTable)
      .set({
        ...filteredInput,
        cnpj: nullableString(parsedInput.cnpj),
        inscricaoEstadual: nullableString(parsedInput.inscricaoEstadual),
        responsibleName: nullableString(parsedInput.responsibleName),
        croResponsavel: nullableString(parsedInput.croResponsavel),
        phone: nullableString(parsedInput.phone),
        email: nullableString(parsedInput.email),
        website: nullableString(parsedInput.website),
        addressComplement: nullableString(parsedInput.addressComplement),
        googleMapsUrl: nullableString(parsedInput.googleMapsUrl),
        logoUrl: nullableString(parsedInput.logoUrl),
        notes: nullableString(parsedInput.notes),
        // Se specialties for um array vazio, salva como []
        specialties: parsedInput.specialties || null,
        paymentMethods: parsedInput.paymentMethods || null,
        // Garante que a data de atualização seja feita pelo $onUpdate do Drizzle
      })
      .where(eq(clinicsTable.id, parsedInput.id));

    // Revalida o path da dashboard e do layout para forçar a atualização do nome da clínica na sidebar
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath("/doctors");
    revalidatePath("/patients");
    revalidatePath("/subscription");

    return { success: true };
  });
