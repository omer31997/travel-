import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

export * from "./models/auth";

// Guarantors (Sponsors/Paying Entities)
export const guarantors = sqliteTable("guarantors", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  email: text("email"),
  address: text("address"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

// Patients
export const patients = sqliteTable("patients", {
  id: integer("id").primaryKey(),
  fullName: text("full_name").notNull(),
  passportNumber: text("passport_number").notNull(),
  medicalReports: text("medical_reports"), // Description or summary
  destination: text("destination"),
  guarantorId: integer("guarantor_id").references(() => guarantors.id),
  status: text("status").notNull().default("New"), // "New", "In Progress", "Travel Expenses Paid", "Traveled", "Treatment Started", "Returned Home", "Paid"
  isLocked: integer("is_locked", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Documents
export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // 'image', 'pdf'
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).defaultNow(),
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

export const STATUS_OPTIONS = ["New", "In Progress", "Travel Expenses Paid", "Traveled", "Treatment Started", "Returned Home", "Paid"] as const;
