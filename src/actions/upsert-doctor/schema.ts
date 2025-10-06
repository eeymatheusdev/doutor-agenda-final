import { z } from "zod";

import {
  BrazilianState,
  DentalSpecialty,
} from "@/app/(protected)/doctors/_constants";

// Array de todas as chaves de estado para o Zod enum
const allBrazilianStates = Object.keys(BrazilianState) as [
  keyof typeof BrazilianState,
  ...(keyof typeof BrazilianState)[],
];

// Array de todos os valores de especialidades para o Zod array de enums
const allDentalSpecialties = Object.values(DentalSpecialty) as [
  DentalSpecialty,
  ...DentalSpecialty[],
];

export const upsertDoctorSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    cro: z.string().trim().min(1, {
      message: "CRO é obrigatório.",
    }),
    email: z.string().email({
      message: "E-mail inválido.",
    }),
    dateOfBirth: z.date({
      required_error: "Data de nascimento é obrigatória.",
    }),
    rg: z.string().trim().min(1, {
      message: "RG é obrigatório.",
    }),
    cpf: z.string().trim().min(1, {
      message: "CPF é obrigatório.",
    }),
    street: z.string().trim().min(1, {
      message: "Rua é obrigatória.",
    }),
    number: z.string().trim().min(1, {
      message: "Número é obrigatório.",
    }),
    neighborhood: z.string().trim().min(1, {
      message: "Bairro é obrigatório.",
    }),
    zipCode: z.string().trim().min(1, {
      message: "CEP é obrigatório.",
    }),
    complement: z.string().optional().nullable(),
    city: z.string().trim().min(1, {
      message: "Cidade é obrigatória.",
    }),
    state: z.enum(allBrazilianStates, {
      // USANDO O ENUM DE ESTADO
      required_error: "Estado é obrigatório.",
    }),
    observations: z.string().optional().nullable(),
    education: z.string().optional().nullable(),
    // MÚLTIPLAS ESPECIALIZAÇÕES
    specialties: z.array(z.enum(allDentalSpecialties)).min(1, {
      message: "Selecione pelo menos uma especialidade.",
    }),
    appointmentPriceInCents: z.number().min(1, {
      message: "Preço da consulta é obrigatório.",
    }),
    availableFromWeekDay: z.number().min(0).max(6),
    availableToWeekDay: z.number().min(0).max(6),
    availableFromTime: z.string().min(1, {
      message: "Hora de início é obrigatória.",
    }),
    availableToTime: z.string().min(1, {
      message: "Hora de término é obrigatória.",
    }),
  })
  .refine(
    (data) => {
      return data.availableFromTime < data.availableToTime;
    },
    {
      message:
        "O horário de início não pode ser anterior ao horário de término.",
      path: ["availableToTime"],
    },
  );

export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;
