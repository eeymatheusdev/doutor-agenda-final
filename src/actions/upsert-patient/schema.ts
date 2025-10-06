import { z } from "zod";

import { BrazilianState } from "@/app/(protected)/doctors/_constants";

const allBrazilianStates = Object.keys(BrazilianState) as [
  keyof typeof BrazilianState,
  ...(keyof typeof BrazilianState)[],
];

export const upsertPatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  phoneNumber: z.string().trim().min(1, {
    message: "Número de telefone é obrigatório.",
  }),
  sex: z.enum(["male", "female"], {
    required_error: "Sexo é obrigatório.",
  }),

  // NOVOS CAMPOS OBRIGATÓRIOS DO PACIENTE
  cpf: z.string().trim().min(1, {
    message: "CPF é obrigatório.",
  }),
  rg: z.string().trim().min(1, {
    message: "RG é obrigatório.",
  }),
  dateOfBirth: z.date({
    required_error: "Data de nascimento é obrigatória.",
  }),

  // NOVOS CAMPOS DE ENDEREÇO (OBRIGATÓRIOS)
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
  city: z.string().trim().min(1, {
    message: "Cidade é obrigatória.",
  }),
  state: z.enum(allBrazilianStates, {
    required_error: "Estado é obrigatório.",
  }),

  // CAMPO DE ENDEREÇO OPCIONAL
  complement: z.string().optional().nullable(),

  // NOVOS CAMPOS DO RESPONSÁVEL (OPCIONAIS)
  responsibleName: z.string().optional().nullable(),
  responsibleCpf: z.string().optional().nullable(),
  responsibleRg: z.string().optional().nullable(),
  responsiblePhoneNumber: z.string().optional().nullable(),
});

export type UpsertPatientSchema = z.infer<typeof upsertPatientSchema>;
