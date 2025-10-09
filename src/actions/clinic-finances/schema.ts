import { z } from "zod";

export const clinicFinanceSchema = z.object({
  id: z.number().optional(),
  type: z.enum(["revenue", "expense", "payment_doctor", "commission"]),
  category: z.string().min(1, "Categoria obrigatória"),
  amount: z.number().positive("O valor deve ser maior que 0"),
  patientId: z.string().uuid().optional().nullable(),
  doctorId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  method: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  status: z.enum(["pending", "paid", "overdue"]).optional(),
});

export type ClinicFinanceSchema = z.infer<typeof clinicFinanceSchema>;
