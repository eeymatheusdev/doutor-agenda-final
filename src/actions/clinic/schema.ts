// src/actions/clinic/schema.ts
import { z } from "zod";

import { BrazilianState } from "@/app/(protected)/doctors/_constants";
import { dentalSpecialtyEnum } from "@/db/schema"; // Reutiliza enum do Drizzle

const allBrazilianStates = Object.keys(BrazilianState) as [
  keyof typeof BrazilianState,
  ...(keyof typeof BrazilianState)[],
];

// O enum de especialidades do Drizzle é um array de strings.
const allDentalSpecialties = dentalSpecialtyEnum.enumValues as [
  string,
  ...string[],
];

// Reutiliza a validação de CNPJ, Phone e CEP baseada nos padrões dos formulários existentes
// CNPJ: 00.000.000/0000-00 (18 caracteres)
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
// Phone: (99) 99999-9999 (15 caracteres)
const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
// CEP: 99999-999 (9 caracteres)
const zipCodeRegex = /^\d{5}-\d{3}$/;

export const upsertClinicSchema = z.object({
  id: z.string().uuid().optional(), // ID agora é opcional

  // Identificação
  name: z.string().trim().min(1, "Nome da clínica é obrigatório."),
  cnpj: z
    .string()
    .regex(cnpjRegex, "CNPJ inválido (00.000.000/0000-00)")
    .optional()
    .nullable(),
  inscricaoEstadual: z.string().optional().nullable(),
  responsibleName: z.string().trim().optional().nullable(),
  croResponsavel: z.string().trim().optional().nullable(),
  specialties: z
    .array(z.enum(allDentalSpecialties as any))
    .min(1, "Selecione pelo menos uma especialidade.")
    .optional()
    .nullable(),

  // Contato e Localização
  phone: z
    .string()
    .regex(phoneRegex, "Telefone inválido ((99) 99999-9999)")
    .optional()
    .nullable(),
  email: z.string().email("E-mail inválido.").optional().nullable(),
  website: z.string().url("URL inválida.").optional().nullable(),
  addressStreet: z
    .string()
    .trim()
    .min(1, "Rua é obrigatória.")
    .optional()
    .nullable(),
  addressNumber: z
    .string()
    .trim()
    .min(1, "Número é obrigatório.")
    .optional()
    .nullable(),
  addressComplement: z.string().optional().nullable(),
  addressNeighborhood: z
    .string()
    .trim()
    .min(1, "Bairro é obrigatório.")
    .optional()
    .nullable(),
  addressCity: z
    .string()
    .trim()
    .min(1, "Cidade é obrigatória.")
    .optional()
    .nullable(),
  addressState: z
    .enum(allBrazilianStates, {
      required_error: "Estado é obrigatório.",
    })
    .optional()
    .nullable(),
  addressZipcode: z
    .string()
    .regex(zipCodeRegex, "CEP inválido (99999-999)")
    .optional()
    .nullable(),
  googleMapsUrl: z.string().url("URL inválida.").optional().nullable(),

  // Informações Administrativas
  // Permitimos string (para fácil manipulação no formulário) e fazemos coerção no Server Action
  openingHours: z.record(z.string()).optional().nullable(),
  paymentMethods: z.array(z.string()).optional().nullable(),
  logoUrl: z.string().url("URL inválida.").optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type UpsertClinicSchema = z.infer<typeof upsertClinicSchema>;
