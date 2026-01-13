import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

export * from "./models/auth";

// Guarantors (Sponsors/Paying Entities)
export const guarantors = pgTable("guarantors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patients
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  passportNumber: text("passport_number").notNull(),
  medicalReports: text("medical_reports"), // Description or summary
  destination: text("destination"),
  guarantorId: integer("guarantor_id").references(() => guarantors.id),
  status: text("status").notNull().default("New"), // New, Processing, Traveled, Returned, Paid
  isLocked: boolean("is_locked").default(false),
  totalCost: integer("total_cost").default(0),
  amountPaid: integer("amount_paid").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // 'image', 'pdf'
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Relations
export const guarantorsRelations = relations(guarantors, ({ many }) => ({
  patients: many(patients),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  guarantor: one(guarantors, {
    fields: [patients.guarantorId],
    references: [guarantors.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  patient: one(patients, {
    fields: [documents.patientId],
    references: [patients.id],
  }),
}));

// Schemas
export const insertGuarantorSchema = createInsertSchema(guarantors).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true, updatedAt: true, isLocked: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadedAt: true });

// Types
export type Guarantor = typeof guarantors.$inferSelect;
export type InsertGuarantor = z.infer<typeof insertGuarantorSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export const STATUS_OPTIONS = ["New", "In Progress", "Traveled", "Paid Deposit", "Finish Treatment", "Come Back", "Bill Collect"] as const;

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(), // 'UPDATE_FINANCIALS', 'UPLOAD_DOC', etc.
  entityId: integer("entity_id").notNull(),
  entityType: text("entity_type").notNull(), // 'patient', 'document', etc.
  userId: integer("user_id"), // Nullable if system action or if we don't strictly enforce generic user link here
  details: text("details"), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

