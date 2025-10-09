import { NextResponse } from "next/server";
import { z } from "zod";

import { getAnamnesesByPatient } from "@/actions/anamnesis/upsert-anamnesis";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const patientId = params.id;

    const validation = z.string().uuid().safeParse(patientId);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }

    const result = await getAnamnesesByPatient({ patientId });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("GET Anamnesis History Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error or Unauthorized" },
      { status: 500 },
    );
  }
}
