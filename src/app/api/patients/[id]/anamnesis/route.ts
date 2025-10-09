// src/app/api/patients/[id]/anamnesis/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAnamnesesByPatient } from "@/actions/anamnesis/upsert-anamnesis";

// GET /api/patients/[id]/anamnesis/ - Retorna o histórico de anamneses para o cliente
export async function GET(
  request: Request,
  // FIX: Usando 'any' para o contexto do Route Handler dinâmico para evitar conflito
  // com os tipos gerados pelo Next.js (`.next/types`) que causam o erro.
  context: any,
) {
  try {
    // Desestruturamos o ID do params dentro do corpo da função
    const patientId = context.params.id;

    // Simples validação de ID
    const validation = z.string().uuid().safeParse(patientId);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }

    // Chama a função server-only para buscar os dados
    const result = await getAnamnesesByPatient({ patientId });

    return NextResponse.json(result);
  } catch (error) {
    // Captura erros de autenticação lançados pelo getAnamnesesByPatient
    console.error("GET Anamnesis History Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error or Unauthorized" },
      { status: 500 },
    );
  }
}
