// src/app/api/patients/[id]/odontogram/route.ts
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  odontogramMarksTable,
  odontogramsTable,
  odontogramStatusEnum,
  patientsTable,
  toothFaceEnum,
} from "@/db/schema";
import { auth } from "@/lib/auth";

const zOdontogramMark = z.object({
  id: z.string().uuid().optional(),
  toothNumber: z.string().min(1),
  face: z.enum(toothFaceEnum.enumValues),
  status: z.enum(odontogramStatusEnum.enumValues),
  observation: z.string().optional().nullable(),
});

// GET /api/patients/[id]/odontogram - Agora retorna a lista completa de registros
export async function GET(
  request: Request,
  // Alterado para 'any' para contornar o erro de tipagem do Next.js
  { params }: any,
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.user.clinic?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    const patient = await db.query.patientsTable.findFirst({
      where: and(
        eq(patientsTable.id, patientId),
        eq(patientsTable.clinicId, session.user.clinic.id),
      ),
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Busca TODOS os odontogramas, ordenados do mais recente para o mais antigo,
    // e inclui as marcas e o nome do médico.
    const odontograms = await db.query.odontogramsTable.findMany({
      where: eq(odontogramsTable.patientId, patientId),
      orderBy: (odontograms, { desc }) => [desc(odontograms.date)], // Ordena pela data do registro
      with: {
        marks: true,
        doctor: {
          columns: {
            name: true, // Apenas o nome do médico é necessário
            id: true,
          },
        },
      },
    });

    // Retorna todos os registros
    return NextResponse.json(odontograms);
  } catch (error) {
    console.error("GET Odontogram Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/patients/[id]/odontogram - Agora sempre cria um novo registro
export async function POST(
  request: Request,
  // Alterado para 'any' para contornar o erro de tipagem do Next.js
  { params }: any,
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.user.clinic?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    const body = await request.json();

    // Novo schema de validação para o POST
    const validationSchema = z.object({
      marks: z.array(zOdontogramMark),
      doctorId: z.string().uuid(), // Novo
      date: z.string().date(), // Novo
    });

    const result = validationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error },
        { status: 400 },
      );
    }

    const { marks, doctorId, date } = result.data; // Desestrutura os novos campos

    const patient = await db.query.patientsTable.findFirst({
      where: and(
        eq(patientsTable.id, patientId),
        eq(patientsTable.clinicId, session.user.clinic.id),
      ),
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // 1. Cria um NOVO odontograma (registro) para o paciente
    const [newOdontogram] = await db
      .insert(odontogramsTable)
      .values({
        patientId: patientId,
        clinicId: session.user.clinic.id,
        doctorId: doctorId, // Salva o ID do médico
        date: date, // Salva a data do registro
      })
      .returning({ id: odontogramsTable.id });
    const newOdontogramId = newOdontogram.id;

    // 2. Insere as marcas associadas a este novo registro (apenas as não-saudáveis)
    if (marks.length > 0) {
      const newMarks = marks.map((mark) => ({
        ...mark,
        odontogramId: newOdontogramId,
      }));
      await db.insert(odontogramMarksTable).values(newMarks);
    }

    // Revalida o path para que a lista de registros seja atualizada na próxima requisição
    revalidatePath(`/patients/${patientId}/odontogram`);

    return NextResponse.json({
      success: true,
      odontogramId: newOdontogramId,
    });
  } catch (error) {
    console.error("POST Odontogram Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
