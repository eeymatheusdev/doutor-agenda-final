import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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

export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
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
}));

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
});

export const doctorsTableRelations = relations(
  doctorsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [doctorsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

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
    odontograms: many(odontogramsTable), // NOVA RELAÇÃO
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
