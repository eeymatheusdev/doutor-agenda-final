// src/app/(protected)/patients/[id]/odontogram/_types/index.ts
import { odontogramMarksTable, odontogramsTable } from "@/db/schema";

import { OdontogramStatus, ToothFace, ToothNumber } from "../_constants";

export type Odontogram = typeof odontogramsTable.$inferSelect & {
  marks: OdontogramMarkDb[];
};
export type OdontogramMarkDb = typeof odontogramMarksTable.$inferSelect;

// Tipo de Marcação no Frontend (simplificado)
export interface OdontogramMark {
  id?: string;
  toothNumber: ToothNumber;
  face: ToothFace;
  status: OdontogramStatus;
  observation: string | null;
}

// Estrutura de dados para o estado de um único dente
export interface ToothState {
  toothNumber: ToothNumber;
  // Mapeamento de face para marcação
  marks: Partial<Record<ToothFace, OdontogramMark>>;
}

// Estrutura do Odontograma no estado
export type OdontogramState = Record<ToothNumber, ToothState>;

// Configuração de cores para as faces do dente (Tailwind classes)
export type FaceMark = {
  color: string;
  status: OdontogramStatus;
  observation: string | null;
};
// Mapeamento de dente para suas marcas visualmente (para o componente Tooth)
export type ToothFaceMarks = Partial<Record<ToothFace, FaceMark>>;
export type VisualOdontogram = Record<ToothNumber, ToothFaceMarks>;
