// src/actions/clinic/schema.ts
import { z } from "zod";

import { BrazilianState } from "@/app/(protected)/doctors/_constants";
import { clinicPaymentMethodsEnum } from "@/db/schema";

const allBrazilianStates = Object.keys(BrazilianState) as [
  keyof typeof BrazilianState,
  ...(keyof typeof BrazilianState)[],
];

const allClinicPaymentMethods = clinicPaymentMethodsEnum.enumValues as [
  string,
  ...string[],
];

export const upsertClinicSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Nome da clínica é obrigatório."),
  cnpj: z
    .string()
    .regex(
      /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
      "CNPJ inválido (00.000.000/0000-00)",
    )
    .optional()
    .nullable(),
  stateBusinessRegistration: z.string().optional().nullable(),
  responsibleName: z
    .string()
    .trim()
    .min(1, "Nome do responsável é obrigatório."),
  croResponsavel: z.string().trim().min(1, "CRO do responsável é obrigatório."),
  paymentMethods: z
    .array(z.enum(allClinicPaymentMethods))
    .min(1, "Selecione pelo menos um método de pagamento."),
  logoUrl: z.string().url("URL inválida.").optional().nullable(),
  observations: z.string().optional().nullable(),

  phone: z
    .string()
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Telefone inválido ((99) 99999-9999)")
    .optional()
    .nullable(),
  whatsApp: z
    .string()
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, "WhatsApp inválido ((99) 99999-9999)")
    .optional()
    .nullable(),
  email: z.string().email("E-mail inválido.").optional().nullable(),
  website: z.string().url("URL inválida.").optional().nullable(),
  addressStreet: z.string().trim().min(1, "Rua/Avenida é obrigatória."),
  addressNumber: z.string().trim().min(1, "Número é obrigatório."),
  addressComplement: z.string().optional().nullable(),
  addressNeighborhood: z.string().trim().min(1, "Bairro é obrigatório."),
  addressCity: z.string().trim().min(1, "Cidade é obrigatória."),
  addressState: z.enum(allBrazilianStates, {
    required_error: "Estado é obrigatório.",
  }),
  addressZipcode: z.string().regex(/^\d{5}-\d{3}$/, "CEP inválido (99999-999)"),
});

export type UpsertClinicSchema = z.infer<typeof upsertClinicSchema>;
