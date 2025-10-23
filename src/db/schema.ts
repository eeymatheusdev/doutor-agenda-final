// src/db/schema.ts
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey, // Added for usersToClinicsTable
  serial,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// --- ENUMS ---

// --- NEW ENUMS for Clinic Finances ---
export const clinicFinancialOperationEnum = pgEnum(
  "clinic_financial_operation",
  [
    "input", // Entrada
    "output", // Saída
  ],
);

export const clinicFinancialTypeInputEnum = pgEnum(
  "clinic_financial_type_input",
  [
    "Recebimento Consulta",
    "Recebimento Procedimento",
    "Recebimento Pacote",
    "Crédito/Adiantamento Paciente",
    "Outras Receitas",
  ],
);

export const clinicFinancialTypeOutputEnum = pgEnum(
  "clinic_financial_type_output",
  [
    "Pagamento Funcionário", // Includes doctors and other employees
    "Compra Equipamentos",
    "Compra Materiais",
    "Aluguel",
    "Água",
    "Luz",
    "Internet/Telefone",
    "Marketing/Publicidade",
    "Impostos/Taxas",
    "Manutenção/Reparos",
    "Despesas Administrativas",
    "Outras Despesas",
  ],
);

// Updated Clinic Financial Status Enum
export const clinicFinancialStatusEnum = pgEnum("clinic_financial_status", [
  "pending", // Pendente
  "paid", // Pago
  "overdue", // Vencido
  "refunded", // Estornado
]);

// Updated Patient Charge Status Enum
export const patientChargeStatusEnum = pgEnum("patient_charge_status", [
  "pending", // Pendente (Cobrança)
  "paid", // Pago (Cobrança)
  "overdue", // Vencido (Cobrança)
]);

// --- EXISTING ENUMS (Keep as they are) ---
export const anamnesisStatusEnum = pgEnum("anamnesis_status", [
  "draft",
  "finalized",
]);
export const patientFinancialStatusEnum = pgEnum("patient_financial_status", [
  "adimplente",
  "inadimplente",
]);
export const patientFinancialTransactionTypeEnum = pgEnum(
  "patient_financial_transaction_type",
  ["charge", "payment"], // Kept for patient finances distinction
);
// ... (other existing enums: toothFaceEnum, employeeRoleEnum, etc. remain unchanged)
export const toothFaceEnum = pgEnum("tooth_face", [
  "vestibular",
  "lingual",
  "mesial",
  "distal",
  "oclusal",
  "incisal",
]);

export const employeeRoleEnum = pgEnum("employee_role", [
  "Recepcionista",
  "Auxiliar de Saúde Bucal",
  "Técnico em Saúde Bucal",
  "Administrativo",
  "Gerente",
]);

export const odontogramStatusEnum = pgEnum("odontogram_status", [
  "carie",
  "restauracao",
  "canal",
  "extracao",
  "protese",
  "implante",
  "ausente",
  "saudavel",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "agendada",
  "atendida",
  "cancelada",
]);

export const dentalProcedureEnum = pgEnum("dental_procedure", [
  "Avaliação Inicial",
  "Limpeza (Profilaxia)",
  "Restauração",
  "Extração",
  "Tratamento de Canal (Endodontia)",
  "Clareamento Dental",
  "Implante Dentário",
  "Consulta de Retorno",
]);

export const brazilianStateEnum = pgEnum("brazilian_state", [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]);

export const dentalSpecialtyEnum = pgEnum("dental_specialty", [
  "Acupuntura",
  "Dentística",
  "Disfunção Temporomandibular e Dor Orofacial",
  "Endodontia",
  "Estomatologia",
  "Implantodontia",
  "Odontologia Legal",
  "Odontologia do Esporte",
  "Odontologia do Trabalho",
  "Odontologia para Pacientes com Necessidades Especiais",
  "Odontogeriatria",
  "Odontopediatria",
  "Ortodontia",
  "Patologia Oral e Maxilofacial",
  "Periodontia",
  "Prótese Dentária",
  "Prótese Bucomaxilofacial",
  "Radiologia Odontológica e Imaginologia",
  "Saúde Coletiva",
  "Cirurgia e Traumatologia Bucomaxilofaciais",
  "Ortopedia Funcional dos Maxilares",
]);

export const clinicPaymentMethodsEnum = pgEnum("clinic_payment_methods", [
  "Dinheiro Em Espécie",
  "Cartão De Débito",
  "Cartão De Crédito",
  "Cartão Pré-Pago",
  "Boleto Bancário",
  "Pix",
  "Transferência TED",
  "Transferência DOC",
  "Transferência Entre Contas Do Mesmo Banco",
  "Débito Automático",
  "Carteiras Digitais",
  "Pagamento Via QR Code",
  "Convênios / Carnês",
  "Saque / Pagamento Em Espécie",
  "Pagamento Recorrente / Assinatura",
  "Financiamento Ou Crédito Direto",
  "Cheque",
  "Depósito Bancário",
]);

export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

// NOVO ENUM para Status do Chamado
export const supportTicketStatusEnum = pgEnum("support_ticket_status", [
  "pending", // Pendente
  "in_progress", // Em Andamento
  "resolved", // Resolvido
]);

// --- TABLES ---

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj"),
  stateBusinessRegistration: text("state_business_registration"),
  responsibleName: text("responsible_name").notNull(),
  croResponsavel: text("cro_responsavel").notNull(),
  paymentMethods: clinicPaymentMethodsEnum("payment_methods").array().notNull(),
  logoUrl: text("logo_url"),
  observations: text("observations"),
  phone: text("phone"),
  whatsApp: text("whatsApp"),
  email: text("email"),
  website: text("website"),
  addressStreet: text("address_street").notNull(),
  addressNumber: text("address_number").notNull(),
  addressComplement: text("address_complement"),
  addressNeighborhood: text("address_neighborhood").notNull(),
  addressCity: text("address_city").notNull(),
  addressState: brazilianStateEnum("address_state").notNull(),
  addressZipcode: text("address_zipcode").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

// Added composite primary key
export const usersToClinicsTable = pgTable(
  "users_to_clinics",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinicsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.clinicId] }),
  }),
);

export const employeesTable = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  avatarImageUrl: text("avatar_image_url"),
  name: text("name").notNull(),
  rg: text("rg").notNull(),
  cpf: text("cpf").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  whatsApp: text("whatsApp"),
  role: employeeRoleEnum("role").array().notNull(),
  observations: text("observations"),
  education: text("education"),
  availableFromWeekDay: integer("available_from_week_day").notNull(),
  availableToWeekDay: integer("available_to_week_day").notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  addressStreet: text("address_street").notNull(),
  addressNumber: text("address_number").notNull(),
  addressComplement: text("address_complement"),
  addressNeighborhood: text("address_neighborhood").notNull(),
  addressCity: text("address_city").notNull(),
  addressState: brazilianStateEnum("address_state").notNull(),
  addressZipcode: text("address_zipcode").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  sex: patientSexEnum("sex").notNull(),
  cpf: text("cpf").notNull(),
  rg: text("rg").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  street: text("street").notNull(),
  number: text("number").notNull(),
  neighborhood: text("neighborhood").notNull(),
  zipCode: text("zip_code").notNull(),
  complement: text("complement"),
  city: text("city").notNull(),
  state: brazilianStateEnum("state").notNull(),
  responsibleName: text("responsible_name"),
  responsibleCpf: text("responsible_cpf"),
  responsibleRg: text("responsible_rg"),
  responsiblePhoneNumber: text("responsible_phone_number"),
  financialStatus: patientFinancialStatusEnum("financial_status")
    .notNull()
    .default("adimplente"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

// --- clinicFinancesTable UPDATED ---
export const clinicFinancesTable = pgTable("clinic_finances", {
  id: serial("id").primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  // New/Modified fields
  operation: clinicFinancialOperationEnum("operation").notNull(),
  typeInput: clinicFinancialTypeInputEnum("type_input"), // Nullable if operation='output'
  typeOutput: clinicFinancialTypeOutputEnum("type_output"), // Nullable if operation='input'
  description: text("description").notNull(),
  amountInCents: integer("amount_in_cents").notNull(), // Changed from numeric to integer
  paymentDate: timestamp("payment_date"), // Date of actual payment/receipt
  dueDate: date("due_date"), // Due date for pending items
  status: clinicFinancialStatusEnum("status").notNull().default("pending"), // Uses updated enum
  paymentMethod: clinicPaymentMethodsEnum("payment_method"), // Added
  observations: text("observations"), // Added
  // Optional foreign keys
  patientId: uuid("patient_id").references(() => patientsTable.id, {
    onDelete: "set null",
  }), // For patient-related income/credits
  employeeId: uuid("employee_id").references(() => employeesTable.id, {
    // Includes doctors
    onDelete: "set null",
  }), // For employee/doctor payments
  linkedPatientChargeIds: jsonb("linked_patient_charge_ids").$type<number[]>(), // Store IDs from patient_finances
  createdBy: text("created_by")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }), // Added
  // Timestamps
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

// --- patientFinancesTable UPDATED ---
export const patientFinancesTable = pgTable("patient_finances", {
  id: serial("id").primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  type: patientFinancialTransactionTypeEnum("type").notNull(), // 'charge' or 'payment'
  amountInCents: integer("amount_in_cents").notNull(),
  description: text("description"),
  method: text("method"), // Only relevant for 'payment' type
  dueDate: date("due_date"), // Added: Due date for charges
  status: patientChargeStatusEnum("status"), // Uses updated enum (pending, paid, overdue) - Nullable for payments
  relatedClinicFinanceId: integer("related_clinic_finance_id").references(
    // Added: Link to clinic_finances entry if paid via clinic transaction
    () => clinicFinancesTable.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

// --- Other tables remain mostly the same, just ensure timestamps are correct ---
export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  avatarImageUrl: text("avatar_image_url"),
  name: text("name").notNull(),
  cro: text("cro").notNull(),
  rg: text("rg").notNull(),
  cpf: text("cpf").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  whatsApp: text("whatsApp"),
  specialties: dentalSpecialtyEnum("specialties").array().notNull(),
  observations: text("observations"),
  education: text("education"),
  availableFromWeekDay: integer("available_from_week_day").notNull(),
  availableToWeekDay: integer("available_to_week_day").notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  addressStreet: text("address_street").notNull(),
  addressNumber: text("address_number").notNull(),
  addressComplement: text("address_complement"),
  addressNeighborhood: text("address_neighborhood").notNull(),
  addressCity: text("address_city").notNull(),
  addressState: brazilianStateEnum("address_state").notNull(),
  addressZipcode: text("address_zipcode").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const anamnesesTable = pgTable("anamneses", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  version: integer("version").notNull().default(1),
  status: anamnesisStatusEnum("status").notNull().default("draft"),
  summary: text("summary"),
  data: jsonb("data").$type<Record<string, any>>().notNull(),
  attachments: jsonb("attachments")
    .$type<{ url: string; name: string; type: string }[]>()
    .default([])
    .notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const odontogramsTable = pgTable("odontograms", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "restrict" }),
  date: date("date").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const odontogramMarksTable = pgTable("odontogram_marks", {
  id: uuid("id").defaultRandom().primaryKey(),
  odontogramId: uuid("odontogram_id")
    .notNull()
    .references(() => odontogramsTable.id, { onDelete: "cascade" }),
  toothNumber: text("tooth_number").notNull(),
  face: toothFaceEnum("face").notNull(),
  status: odontogramStatusEnum("status").notNull(),
  observation: text("observation"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  status: appointmentStatusEnum("status").notNull(),
  procedure: dentalProcedureEnum("procedure").notNull(),
  appointmentDateTime: timestamp("appointmentDateTime").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

// NOVA TABELA para Chamados de Suporte
export const supportTicketsTable = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }), // Quem abriu
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: supportTicketStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

// --- RELATIONS ---

export const usersTableRelations = relations(usersTable, ({ many }) => ({
  usersToClinics: many(usersToClinicsTable),
  anamneses: many(anamnesesTable),
  createdClinicFinances: many(clinicFinancesTable, { relationName: "creator" }),
  supportTickets: many(supportTicketsTable), // Adicionado
}));

export const usersToClinicsTableRelations = relations(
  usersToClinicsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [usersToClinicsTable.userId],
      references: [usersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [usersToClinicsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

export const clinicsTableRelations = relations(clinicsTable, ({ many }) => ({
  doctors: many(doctorsTable),
  patients: many(patientsTable),
  appointments: many(appointmentsTable),
  usersToClinics: many(usersToClinicsTable),
  odontograms: many(odontogramsTable),
  clinicFinances: many(clinicFinancesTable),
  employees: many(employeesTable),
  anamneses: many(anamnesesTable),
  patientFinances: many(patientFinancesTable),
  supportTickets: many(supportTicketsTable), // Adicionado
}));

export const clinicFinancesTableRelations = relations(
  clinicFinancesTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [clinicFinancesTable.clinicId],
      references: [clinicsTable.id],
    }),
    patient: one(patientsTable, {
      fields: [clinicFinancesTable.patientId],
      references: [patientsTable.id],
    }),
    employee: one(employeesTable, {
      fields: [clinicFinancesTable.employeeId],
      references: [employeesTable.id],
    }), // Includes doctors via employees table logic if needed or direct link if separated
    creator: one(usersTable, {
      fields: [clinicFinancesTable.createdBy],
      references: [usersTable.id],
      relationName: "creator",
    }),
    // Relation to patient finances (if a clinic payment pays off specific charges)
    paidPatientCharges: one(patientFinancesTable, {
      fields: [clinicFinancesTable.linkedPatientChargeIds],
      references: [patientFinancesTable.id],
    }), // This relation might need adjustment based on how linkedPatientChargeIds is queried
  }),
);

export const patientFinancesTableRelations = relations(
  patientFinancesTable,
  ({ one }) => ({
    patient: one(patientsTable, {
      fields: [patientFinancesTable.patientId],
      references: [patientsTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [patientFinancesTable.clinicId],
      references: [clinicsTable.id],
    }),
    relatedClinicFinance: one(clinicFinancesTable, {
      fields: [patientFinancesTable.relatedClinicFinanceId],
      references: [clinicFinancesTable.id],
    }),
  }),
);

export const employeesTableRelations = relations(
  employeesTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [employeesTable.clinicId],
      references: [clinicsTable.id],
    }),
    clinicFinances: many(clinicFinancesTable), // Payments made to this employee
  }),
);

export const patientsTableRelations = relations(
  patientsTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [patientsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
    odontograms: many(odontogramsTable),
    anamneses: many(anamnesesTable),
    finances: many(patientFinancesTable), // Patient's own financial history (charges/payments)
    clinicFinances: many(clinicFinancesTable), // Clinic transactions related to this patient
  }),
);

// Other relations remain the same
export const doctorsTableRelations = relations(
  doctorsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [doctorsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
    odontograms: many(odontogramsTable),
    // Doctors are now linked via employeesTable if they are paid through it
  }),
);

export const anamnesesTableRelations = relations(anamnesesTable, ({ one }) => ({
  patient: one(patientsTable, {
    fields: [anamnesesTable.patientId],
    references: [patientsTable.id],
  }),
  clinic: one(clinicsTable, {
    fields: [anamnesesTable.clinicId],
    references: [clinicsTable.id],
  }),
  creator: one(usersTable, {
    fields: [anamnesesTable.createdBy],
    references: [usersTable.id],
  }),
}));

export const odontogramsTableRelations = relations(
  odontogramsTable,
  ({ one, many }) => ({
    patient: one(patientsTable, {
      fields: [odontogramsTable.patientId],
      references: [patientsTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [odontogramsTable.clinicId],
      references: [clinicsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [odontogramsTable.doctorId],
      references: [doctorsTable.id],
    }),
    marks: many(odontogramMarksTable),
  }),
);

export const odontogramMarksTableRelations = relations(
  odontogramMarksTable,
  ({ one }) => ({
    odontogram: one(odontogramsTable, {
      fields: [odontogramMarksTable.odontogramId],
      references: [odontogramsTable.id],
    }),
  }),
);

export const appointmentsTableRelations = relations(
  appointmentsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [appointmentsTable.clinicId],
      references: [clinicsTable.id],
    }),
    patient: one(patientsTable, {
      fields: [appointmentsTable.patientId],
      references: [patientsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [appointmentsTable.doctorId],
      references: [doctorsTable.id],
    }),
  }),
);

// NOVA RELAÇÃO para Chamados de Suporte
export const supportTicketsTableRelations = relations(
  supportTicketsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [supportTicketsTable.clinicId],
      references: [clinicsTable.id],
    }),
    user: one(usersTable, {
      // Relação com o usuário que abriu
      fields: [supportTicketsTable.userId],
      references: [usersTable.id],
    }),
  }),
);
