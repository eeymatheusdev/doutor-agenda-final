import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// NOVO: Enum para Status de Anamnese
export const anamnesisStatusEnum = pgEnum("anamnesis_status", [
  "draft",
  "finalized",
]);

// NOVO: Tabela para Anamneses (Fichas Clínicas)
export const anamnesesTable = pgTable("anamneses", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  createdBy: text("created_by") // User ID (quem criou/editou)
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  version: integer("version").notNull().default(1),
  status: anamnesisStatusEnum("status").notNull().default("draft"),
  summary: text("summary"), // Resumo curto para listagem
  // O campo 'data' armazena o corpo estruturado da anamnese (JSONB)
  data: jsonb("data").$type<Record<string, any>>().notNull(),
  // O campo 'attachments' armazena URLs de imagens/arquivos (JSONB de array de objetos)
  attachments: jsonb("attachments")
    .$type<{ url: string; name: string; type: string }[]>()
    .default([])
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const usersTableRelations = relations(usersTable, ({ many }) => ({
  usersToClinics: many(usersToClinicsTable),
  anamneses: many(anamnesesTable), // NOVA RELAÇÃO
}));

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
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
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// NOVO: Enum para Status Financeiro do Paciente
export const patientFinancialStatusEnum = pgEnum("patient_financial_status", [
  "adimplente",
  "inadimplente",
]);

// NOVO: Enum para Status Financeiro do Doutor
export const doctorFinancialStatusEnum = pgEnum("doctor_financial_status", [
  "adimplente",
  "pendente",
  "atrasado",
]);

// CORRIGIDO: Enum para Tipo de Transação Financeira do Paciente
export const patientFinancialTransactionTypeEnum = pgEnum(
  "patient_financial_transaction_type",
  ["charge", "payment"],
);

// NOVO: Enum para Tipo de Transação Financeira do Médico
export const doctorFinancialTransactionTypeEnum = pgEnum(
  "doctor_financial_transaction_type",
  ["commission", "payment"],
);

// NOVO: Enum para Status da Cobrança
export const chargeStatusEnum = pgEnum("charge_status", ["pending", "paid"]);

// NOVO: Enum para Faces do Dente
export const toothFaceEnum = pgEnum("tooth_face", [
  "vestibular",
  "lingual",
  "mesial",
  "distal",
  "oclusal",
  "incisal",
]);

// NOVO: Enum para Status/Marcações do Odontograma
export const odontogramStatusEnum = pgEnum("odontogram_status", [
  "carie",
  "restauracao",
  "canal",
  "extracao",
  "protese",
  "implante",
  "ausente",
  "saudavel", // Adicionando um status padrão para representação
]);

// NOVO: Enum para Status de Agendamento
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "cancelada",
  "remarcada",
  "agendada",
  "atendida",
  "nao_atendida",
]);

// NOVO: Enum para Procedimentos Odontológicos
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

export const clinicFinancialTransactionTypeEnum = pgEnum(
  "clinic_financial_transaction_type",
  ["revenue", "expense", "payment_doctor", "commission"],
);

export const clinicFinancialStatusEnum = pgEnum("clinic_financial_status", [
  "pending",
  "paid",
  "overdue",
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
  "Carterias Digitais",
  "Pagamento Via QR Code",
  "Convênios / Carnês",
  "Saque / Pagamento Em Espécie",
  "Pagamento Recorrente / Assinatura",
  "Financiamento Ou Crédito Direto",
  "Cheque",
  "Depósito Bancário",
]);

export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

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

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
  clinicFinances: many(clinicFinancesTable), // Nova Relação
}));

export const clinicFinancesTable = pgTable("clinic_finances", {
  id: serial("id").primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").references(() => patientsTable.id, {
    onDelete: "set null",
  }),
  doctorId: uuid("doctor_id").references(() => doctorsTable.id, {
    onDelete: "set null",
  }),
  type: clinicFinancialTransactionTypeEnum("type").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  method: text("method"),
  dueDate: date("due_date"),
  status: clinicFinancialStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
    doctor: one(doctorsTable, {
      fields: [clinicFinancesTable.doctorId],
      references: [doctorsTable.id],
    }),
  }),
);

export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarImageUrl: text("avatar_image_url"),
  // 1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday, 6 - Saturday, 0 - Sunday
  availableFromWeekDay: integer("available_from_week_day").notNull(),
  availableToWeekDay: integer("available_to_week_day").notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  specialties: dentalSpecialtyEnum("specialties").array().notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),

  cro: text("cro").notNull(),
  email: text("email").notNull().unique(),
  dateOfBirth: date("date_of_birth").notNull(), // Data de nascimento (opcional)
  rg: text("rg").notNull(), // RG (opcional)
  cpf: text("cpf").notNull(), // CPF (opcional)
  street: text("street").notNull(),
  number: text("number").notNull(),
  neighborhood: text("neighborhood").notNull(),
  zipCode: text("zip_code").notNull(),
  complement: text("complement"),
  city: text("city").notNull(),
  state: brazilianStateEnum("state").notNull(),
  observations: text("observations"), // Observações (opcional)
  education: text("education"), // Formações (opcional)
  financialStatus: doctorFinancialStatusEnum("financial_status")
    .notNull()
    .default("adimplente"),
});

export const doctorsTableRelations = relations(
  doctorsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [doctorsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
    odontograms: many(odontogramsTable), // NOVA RELAÇÃO
    finances: many(doctorFinancesTable),
  }),
);

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sex: patientSexEnum("sex").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  cpf: text("cpf").notNull(),
  rg: text("rg").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  // NOVOS CAMPOS DE ENDEREÇO (OBRIGATÓRIOS)
  street: text("street").notNull(),
  number: text("number").notNull(),
  neighborhood: text("neighborhood").notNull(),
  zipCode: text("zip_code").notNull(),
  complement: text("complement"), // Opcional
  city: text("city").notNull(),
  state: brazilianStateEnum("state").notNull(),

  // NOVOS CAMPOS DO RESPONSÁVEL (OPCIONAIS)
  responsibleName: text("responsible_name"),
  responsibleCpf: text("responsible_cpf"),
  responsibleRg: text("responsible_rg"),
  responsiblePhoneNumber: text("responsible_phone_number"),
  financialStatus: patientFinancialStatusEnum("financial_status")
    .notNull()
    .default("adimplente"),
});

export const patientFinancesTable = pgTable("patient_finances", {
  id: serial("id").primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  type: patientFinancialTransactionTypeEnum("type").notNull(), // 'charge' ou 'payment'
  amountInCents: integer("amount_in_cents").notNull(),
  description: text("description"),
  method: text("method"),
  dueDate: date("due_date"),
  status: chargeStatusEnum("status"), // Apenas para cobranças
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// NOVO: Tabela para Odontogramas (Representa uma versão/visita)
export const odontogramsTable = pgTable("odontograms", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id") // Relacionar à clínica para segurança
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  // NOVOS CAMPOS OBRIGATÓRIOS:
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "restrict" }),
  date: date("date").notNull(), // Data do registro
  // FIM NOVOS CAMPOS OBRIGATÓRIOS
});

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
      // NOVA RELAÇÃO
      fields: [odontogramsTable.doctorId],
      references: [doctorsTable.id],
    }),
    marks: many(odontogramMarksTable),
  }),
);

// NOVO: Tabela para as Marcações dos Dentes
export const odontogramMarksTable = pgTable("odontogram_marks", {
  id: uuid("id").defaultRandom().primaryKey(),
  odontogramId: uuid("odontogram_id")
    .notNull()
    .references(() => odontogramsTable.id, { onDelete: "cascade" }),
  // Número do dente (FDI) - Ex: '11', '48'
  toothNumber: text("tooth_number").notNull(),
  // Face do dente - Ex: 'oclusal', 'mesial'
  face: toothFaceEnum("face").notNull(),
  // Status/Marcação - Ex: 'carie', 'restauracao'
  status: odontogramStatusEnum("status").notNull(),
  // Observação opcional
  observation: text("observation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const odontogramMarksTableRelations = relations(
  odontogramMarksTable,
  ({ one }) => ({
    odontogram: one(odontogramsTable, {
      fields: [odontogramMarksTable.odontogramId],
      references: [odontogramsTable.id],
    }),
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
    anamneses: many(anamnesesTable), // NOVA RELAÇÃO
    finances: many(patientFinancesTable), // NOVA RELAÇÃO
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
  }),
);

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  status: appointmentStatusEnum("status").notNull(),
  procedure: dentalProcedureEnum("procedure").notNull(),
});

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

export const doctorFinancesTable = pgTable("doctor_finances", {
  id: serial("id").primaryKey(),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").references(() => patientsTable.id, {
    onDelete: "set null",
  }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  type: doctorFinancialTransactionTypeEnum("type").notNull(),
  amountInCents: integer("amount_in_cents").notNull(),
  description: text("description"),
  method: text("method"),
  dueDate: date("due_date"),
  status: chargeStatusEnum("status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const doctorFinancesTableRelations = relations(
  doctorFinancesTable,
  ({ one }) => ({
    doctor: one(doctorsTable, {
      fields: [doctorFinancesTable.doctorId],
      references: [doctorsTable.id],
    }),
    patient: one(patientsTable, {
      fields: [doctorFinancesTable.patientId],
      references: [patientsTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [doctorFinancesTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);
