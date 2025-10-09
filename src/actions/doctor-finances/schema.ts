import { z } from "zod";

export const upsertDoctorFinanceSchema = z.object({
  id: z.number().optional(),
  doctorId: z.string().uuid(),
  patientId: z.string().uuid().optional().nullable(),
  type: z.enum(["commission", "payment"]),
  amount: z.number().positive("O valor deve ser maior que zero."),
  description: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  status: z.enum(["pending", "paid"]).optional().nullable(),
});

export type UpsertDoctorFinanceSchema = z.infer<
  typeof upsertDoctorFinanceSchema
>;
