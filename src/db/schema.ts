import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Agencies (Tenants)
export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  status: text("status").notNull().default("active"), // active, suspended, trial
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    statusIdx: index("agency_status_idx").on(table.status),
    createdAtIdx: index("agency_created_at_idx").on(table.createdAt),
  };
});

// 2. Roles
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("role_agency_id_idx").on(table.agencyId),
    createdAtIdx: index("role_created_at_idx").on(table.createdAt),
  };
});

// 3. Permissions
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("permission_agency_id_idx").on(table.agencyId),
  };
});

// 4. Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  roleId: integer("role_id").references(() => roles.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("user_agency_id_idx").on(table.agencyId),
    statusIdx: index("user_status_idx").on(table.status),
    createdAtIdx: index("user_created_at_idx").on(table.createdAt),
    emailUnique: uniqueIndex("user_email_agency_unique").on(table.agencyId, table.email),
  };
});

// 5. Workers (Candidates / Job Seekers)
export const workers = pgTable("workers", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // male, female, other
  nationality: text("nationality"),
  passportNumber: text("passport_number").notNull(),
  passportExpiryDate: timestamp("passport_expiry_date"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  status: text("status").notNull().default("available"), // available, processing, deployed, blacklisted, returned
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("worker_agency_id_idx").on(table.agencyId),
    passportNumberIdx: index("worker_passport_number_idx").on(table.passportNumber),
    statusIdx: index("worker_status_idx").on(table.status),
    createdAtIdx: index("worker_created_at_idx").on(table.createdAt),
    expiryDateIdx: index("worker_expiry_date_idx").on(table.passportExpiryDate),
  };
});

// 6. Worker Documents
export const workerDocuments = pgTable("worker_documents", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  workerId: integer("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(), // passport, medical, police_clearance, training_cert, contract, visa
  documentNumber: text("document_number"),
  fileUrl: text("file_url").notNull(),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("pending"), // pending, verified, rejected, expired
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("worker_doc_agency_id_idx").on(table.agencyId),
    workerIdIdx: index("worker_doc_worker_id_idx").on(table.workerId),
    statusIdx: index("worker_doc_status_idx").on(table.status),
    createdAtIdx: index("worker_doc_created_at_idx").on(table.createdAt),
    expiryDateIdx: index("worker_doc_expiry_date_idx").on(table.expiryDate),
  };
});

// 7. Worker Skills
export const workerSkills = pgTable("worker_skills", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  workerId: integer("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  skillName: text("skill_name").notNull(), // housemaid, cooking, childcare, elderly_care, driving
  experienceYears: integer("experience_years"),
  proficiencyLevel: text("proficiency_level"), // beginner, intermediate, expert
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("worker_skill_agency_id_idx").on(table.agencyId),
    workerIdIdx: index("worker_skill_worker_id_idx").on(table.workerId),
    createdAtIdx: index("worker_skill_created_at_idx").on(table.createdAt),
  };
});

// 8. Worker Languages
export const workerLanguages = pgTable("worker_languages", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  workerId: integer("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  language: text("language").notNull(), // Arabic, English, French, etc.
  proficiency: text("proficiency"), // basic, conversational, fluent, native
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("worker_lang_agency_id_idx").on(table.agencyId),
    workerIdIdx: index("worker_lang_worker_id_idx").on(table.workerId),
    createdAtIdx: index("worker_lang_created_at_idx").on(table.createdAt),
  };
});

// 9. Clients (Employers / Foreign Agencies)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  country: text("country").notNull(),
  address: text("address"),
  status: text("status").notNull().default("active"), // active, inactive, blacklisted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("client_agency_id_idx").on(table.agencyId),
    statusIdx: index("client_status_idx").on(table.status),
    createdAtIdx: index("client_created_at_idx").on(table.createdAt),
  };
});

// 10. Recruitment Orders (Demand Orders from Clients)
export const recruitmentOrders = pgTable("recruitment_orders", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  orderNumber: text("order_number").notNull(),
  position: text("position").notNull(), // e.g. Housemaid, Driver
  quantity: integer("quantity").notNull().default(1),
  filledQuantity: integer("filled_quantity").notNull().default(0),
  salary: numeric("salary", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  requirements: jsonb("requirements"),
  status: text("status").notNull().default("open"), // open, in_progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("order_agency_id_idx").on(table.agencyId),
    clientIdIdx: index("order_client_id_idx").on(table.clientId),
    statusIdx: index("order_status_idx").on(table.status),
    createdAtIdx: index("order_created_at_idx").on(table.createdAt),
  };
});

// 11. Recruitment Candidates (Linking Workers to Orders)
export const recruitmentCandidates = pgTable("recruitment_candidates", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => recruitmentOrders.id, { onDelete: "cascade" }),
  workerId: integer("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("nominated"), // nominated, shortlisted, interviewed, medical_pending, visa_processing, deployed, rejected
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("candidate_agency_id_idx").on(table.agencyId),
    workerIdIdx: index("candidate_worker_id_idx").on(table.workerId),
    orderIdIdx: index("candidate_order_id_idx").on(table.orderId),
    statusIdx: index("candidate_status_idx").on(table.status),
    createdAtIdx: index("candidate_created_at_idx").on(table.createdAt),
  };
});

// 12. Contracts
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  workerId: integer("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  contractNumber: text("contract_number").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  salary: numeric("salary", { precision: 10, scale: 2 }),
  terms: jsonb("terms"),
  status: text("status").notNull().default("active"), // draft, active, completed, terminated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("contract_agency_id_idx").on(table.agencyId),
    workerIdIdx: index("contract_worker_id_idx").on(table.workerId),
    clientIdIdx: index("contract_client_id_idx").on(table.clientId),
    statusIdx: index("contract_status_idx").on(table.status),
    createdAtIdx: index("contract_created_at_idx").on(table.createdAt),
    expiryDateIdx: index("contract_expiry_date_idx").on(table.endDate),
  };
});

// 13. Visas
export const visas = pgTable("visas", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  workerId: integer("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  visaNumber: text("visa_number").notNull(),
  visaType: text("visa_type").notNull(), // employment, transit, visit
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date").notNull(),
  status: text("status").notNull().default("processing"), // processing, approved, rejected, expired
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("visa_agency_id_idx").on(table.agencyId),
    workerIdIdx: index("visa_worker_id_idx").on(table.workerId),
    statusIdx: index("visa_status_idx").on(table.status),
    createdAtIdx: index("visa_created_at_idx").on(table.createdAt),
    expiryDateIdx: index("visa_expiry_date_idx").on(table.expiryDate),
  };
});

// 14. Travel Records
export const travelRecords = pgTable("travel_records", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  workerId: integer("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  flightNumber: text("flight_number").notNull(),
  departureAirport: text("departure_airport").notNull(),
  arrivalAirport: text("arrival_airport").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  ticketNumber: text("ticket_number"),
  status: text("status").notNull().default("booked"), // booked, confirmed, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("travel_agency_id_idx").on(table.agencyId),
    workerIdIdx: index("travel_worker_id_idx").on(table.workerId),
    statusIdx: index("travel_status_idx").on(table.status),
    createdAtIdx: index("travel_created_at_idx").on(table.createdAt),
  };
});

// 15. Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0.00"),
  currency: text("currency").default("USD"),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("unpaid"), // draft, unpaid, paid, partially_paid, overdue, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("invoice_agency_id_idx").on(table.agencyId),
    clientIdIdx: index("invoice_client_id_idx").on(table.clientId),
    statusIdx: index("invoice_status_idx").on(table.status),
    createdAtIdx: index("invoice_created_at_idx").on(table.createdAt),
  };
});

// 16. Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  paymentMethod: text("payment_method").notNull(), // bank_transfer, cash, credit_card, mobile_money
  referenceNumber: text("reference_number"),
  paymentDate: timestamp("payment_date").notNull(),
  status: text("status").notNull().default("completed"), // pending, completed, failed, refunded
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("payment_agency_id_idx").on(table.agencyId),
    statusIdx: index("payment_status_idx").on(table.status),
    createdAtIdx: index("payment_created_at_idx").on(table.createdAt),
  };
});

// 17. Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // medical, training, visa_fee, ticket, office
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  description: text("description"),
  expenseDate: timestamp("expense_date").notNull(),
  status: text("status").notNull().default("approved"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("expense_agency_id_idx").on(table.agencyId),
    statusIdx: index("expense_status_idx").on(table.status),
    createdAtIdx: index("expense_created_at_idx").on(table.createdAt),
  };
});

// 18. Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("notification_agency_id_idx").on(table.agencyId),
    createdAtIdx: index("notification_created_at_idx").on(table.createdAt),
  };
});

// 19. Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("audit_agency_id_idx").on(table.agencyId),
    createdAtIdx: index("audit_created_at_idx").on(table.createdAt),
  };
});

// 20. Subscriptions (SaaS Billing for Agencies)
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  planName: text("plan_name").notNull(), // starter, professional, enterprise
  status: text("status").notNull().default("active"), // active, trialing, past_due, cancelled
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("subscription_agency_id_idx").on(table.agencyId),
    statusIdx: index("subscription_status_idx").on(table.status),
    createdAtIdx: index("subscription_created_at_idx").on(table.createdAt),
    expiryDateIdx: index("subscription_expiry_date_idx").on(table.currentPeriodEnd),
  };
});

// 21. AI Conversations
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").notNull().references(() => agencies.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull(), // Array of chat messages
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    agencyIdIdx: index("ai_conv_agency_id_idx").on(table.agencyId),
    createdAtIdx: index("ai_conv_created_at_idx").on(table.createdAt),
  };
});
