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

const zUpdateOdontogramSchema = z.object({
  marks: z.array(zOdontogramMark),
  odontogramId: z.string().uuid().optional(),
});

// GET /api/patients/[id]/odontogram
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
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

    // Busca o odontograma mais recente para o paciente
    const odontogram = await db.query.odontogramsTable.findFirst({
      where: eq(odontogramsTable.patientId, patientId),
      orderBy: (odontograms, { desc }) => [desc(odontograms.createdAt)],
      with: {
        marks: true,
      },
    });

    return NextResponse.json(odontogram);
  } catch (error) {
    console.error("GET Odontogram Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/patients/[id]/odontogram
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.user.clinic?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patientId = params.id;
    const body = await request.json();

    const result = zUpdateOdontogramSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error },
        { status: 400 },
      );
    }

    const { marks, odontogramId } = result.data;

    const patient = await db.query.patientsTable.findFirst({
      where: and(
        eq(patientsTable.id, patientId),
        eq(patientsTable.clinicId, session.user.clinic.id),
      ),
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    let currentOdontogramId = odontogramId;

    // Se não houver ID, cria um novo odontograma para o paciente
    if (!currentOdontogramId) {
      const [newOdontogram] = await db
        .insert(odontogramsTable)
        .values({
          patientId: patientId,
          clinicId: session.user.clinic.id,
        })
        .returning({ id: odontogramsTable.id });
      currentOdontogramId = newOdontogram.id;
    }

    // Deleta todas as marcas existentes para o odontograma atual para um "full update"
    await db
      .delete(odontogramMarksTable)
      .where(eq(odontogramMarksTable.odontogramId, currentOdontogramId));

    // Insere as novas marcas (apenas as não-saudáveis são enviadas)
    if (marks.length > 0) {
      const newMarks = marks.map((mark) => ({
        ...mark,
        odontogramId: currentOdontogramId!,
      }));
      await db.insert(odontogramMarksTable).values(newMarks);
    }

    revalidatePath(`/patients/${patientId}/odontogram`);

    return NextResponse.json({
      success: true,
      odontogramId: currentOdontogramId,
    });
  } catch (error) {
    console.error("POST Odontogram Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
