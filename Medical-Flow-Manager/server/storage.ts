import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  users, patients, guarantors, documents,
  type User, type InsertUser,
  type Patient, type InsertPatient,
  type Guarantor, type InsertGuarantor,
  type Document, type InsertDocument
} from "@shared/schema";

export interface IStorage {
  // Guarantors
  getGuarantors(): Promise<Guarantor[]>;
  getGuarantor(id: number): Promise<Guarantor | undefined>;
  createGuarantor(guarantor: InsertGuarantor): Promise<Guarantor>;

  // Patients
  getPatients(params?: { search?: string; status?: string }): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient>;
  deletePatient(id: number): Promise<void>;

  // Documents
  getDocuments(patientId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  getDocument(id: number): Promise<Document | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Guarantors
  async getGuarantors(): Promise<Guarantor[]> {
    return await db.select().from(guarantors).orderBy(desc(guarantors.createdAt));
  }

  async getGuarantor(id: number): Promise<Guarantor | undefined> {
    const [guarantor] = await db.select().from(guarantors).where(eq(guarantors.id, id));
    return guarantor;
  }

  async createGuarantor(insertGuarantor: InsertGuarantor): Promise<Guarantor> {
    const [guarantor] = await db.insert(guarantors).values(insertGuarantor).returning();
    return guarantor;
  }

  // Patients
  async getPatients(params?: { search?: string; status?: string }): Promise<Patient[]> {
    let query = db.select().from(patients).orderBy(desc(patients.createdAt));
    
    // Simple in-memory filtering for search if needed or extend query
    // For now returning all, basic implementation
    const allPatients = await query;
    return allPatients.filter(p => {
        if (params?.status && p.status !== params.status) return false;
        if (params?.search) {
            const search = params.search.toLowerCase();
            return p.fullName.toLowerCase().includes(search) || p.passportNumber.toLowerCase().includes(search);
        }
        return true;
    });
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values(insertPatient).returning();
    return patient;
  }

  async updatePatient(id: number, updates: Partial<InsertPatient>): Promise<Patient> {
    const [patient] = await db.update(patients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient;
  }

  async deletePatient(id: number): Promise<void> {
    await db.delete(patients).where(eq(patients.id, id));
  }

  // Documents
  async getDocuments(patientId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.patientId, patientId));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }
}

export const storage = new DatabaseStorage();
