// src/actions/anamnesis/upsert-anamnesis.ts
"use server"; // FIX: Adicionado para isolar imports de servidor

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { anamnesesTable, usersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { anamnesisSchema } from "./schema";

export type AnamnesisRecord = typeof anamnesesTable.$inferSelect & {
  creator: { id: string; name: string };
};

// Função auxiliar para gerar um resumo
const generateSummary = (data: z.infer<typeof anamnesisSchema>): string => {
  const chiefComplaint =
    data.chiefComplaint || "Nenhuma queixa principal registrada.";
  const conditions = data.knownConditions?.length
    ? data.knownConditions
        .map((c) => c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " "))
        .join(", ")
    : "Nenhuma condição conhecida.";

  return `Queixa: ${chiefComplaint}. Condições: ${conditions}.`;
};

export const upsertAnamnesis = actionClient
  .schema(
    anamnesisSchema.extend({
      // Adiciona campos de data como string para fácil formatação antes da inserção
      onsetDate: z.string().optional().nullable(),
      lastDentalVisit: z.string().optional().nullable(),
      consentDate: z.string().optional().nullable(),
      followUpDate: z.string().optional().nullable(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !session.user.clinic?.id) {
      throw new Error("Não autorizado ou clínica não encontrada.");
    }

    // O id é agora um campo no schema extendido (vem do form)
    const { id, patientId, ...formData } = parsedInput;
    const clinicId = session.user.clinic.id;
    const createdBy = session.user.id;

    // Constrói o objeto completo para o summary (incluindo patientId)
    const dataForSummary = {
      patientId, // FIX: Re-adiciona patientId ao objeto para tipagem do summary
      ...formData,
    } as z.infer<typeof anamnesisSchema>;

    // Remove o id e patientId do objeto de dados a serem armazenados
    const dataToStore = Object.fromEntries(
      Object.entries(formData).filter(([key]) => key !== "id"),
    );
    const summary = generateSummary(dataForSummary); // FIX: Chamada com objeto completo

    if (id) {
      // Opção 1: Atualiza um rascunho existente (se o ID for fornecido)
      await db
        .update(anamnesesTable)
        .set({
          summary,
          data: dataToStore,
          attachments: parsedInput.attachments || [],
          // A coluna updatedAt é atualizada automaticamente pelo Drizzle
        })
        .where(
          and(eq(anamnesesTable.id, id), eq(anamnesesTable.clinicId, clinicId)),
        );
    } else {
      // Opção 2: Insere um novo registro (nova versão ou primeiro)
      const latestRecord = await db.query.anamnesesTable.findFirst({
        where: and(
          eq(anamnesesTable.patientId, patientId),
          eq(anamnesesTable.clinicId, clinicId),
        ),
        orderBy: desc(anamnesesTable.version),
      });

      const nextVersionForInsert = latestRecord ? latestRecord.version + 1 : 1;

      await db.insert(anamnesesTable).values({
        patientId,
        clinicId,
        createdBy,
        version: nextVersionForInsert,
        status: "draft",
        summary,
        data: dataToStore,
        attachments: parsedInput.attachments || [],
      });
    }

    revalidatePath(`/patients/${patientId}/anamnesis`);
    return { success: true };
  });

// FUNÇÃO SERVER-ONLY para buscar histórico (usada pela API Route)
export async function getAnamnesesByPatient(parsedInput: {
  patientId: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.user.clinic?.id) {
    // Lançar erro para ser capturado e tratado pela API Route
    throw new Error("Não autorizado ou clínica não encontrada.");
  }

  const clinicId = session.user.clinic.id;

  const anamneses = await db.query.anamnesesTable.findMany({
    where: and(
      eq(anamnesesTable.patientId, parsedInput.patientId),
      eq(anamnesesTable.clinicId, clinicId),
    ),
    with: {
      creator: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: desc(anamnesesTable.version),
  });

  // Adapta o tipo para inclusão do criador
  return anamneses as AnamnesisRecord[];
}
