import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { type User } from "@shared/models/auth";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));

  // Ensure uploads directory exists
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  // Patients
  app.get(api.patients.list.path, isAuthenticated, async (req, res) => {
    const params = api.patients.list.input?.parse(req.query);
    const patients = await storage.getPatients(params);
    res.json(patients);
  });

  app.get(api.patients.get.path, isAuthenticated, async (req, res) => {
    const patient = await storage.getPatient(Number(req.params.id));
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const guarantor = patient.guarantorId ? await storage.getGuarantor(patient.guarantorId) : null;
    const documents = await storage.getDocuments(patient.id);

    res.json({ ...patient, guarantor, documents });
  });

  app.post(api.patients.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.patients.create.input.parse(req.body);
      const patient = await storage.createPatient(input);
      res.status(201).json(patient);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put(api.patients.update.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getPatient(id);
    if (!existing) return res.status(404).json({ message: "Patient not found" });

    // Check locking
    const user = (req as any).user as User;
    if (existing.isLocked && user.role !== 'admin') {
      return res.status(403).json({ message: "File is locked. Only admin can edit." });
    }

    try {
      const input = api.patients.update.input.parse(req.body);

      // Auto-lock logic
      let updates = { ...input };
      if (input.status === 'Paid' && !existing.isLocked) {
        // If status becomes Paid, lock it (unless admin wants to force unlock, but simple logic for now)
        // Actually, "Once status is Paid, it is locked automatically". 
        // We can set isLocked = true here.
        // But input schema partial doesn't include isLocked (it was omitted in schema).
        // We can use storage direct method or specific logic.
        // I will manually update isLocked if status is Paid.
      }

      const updated = await storage.updatePatient(id, updates);

      // If status changed to Paid, lock it
      if (updated.status === 'Paid' && !updated.isLocked) {
        // Need a way to set isLocked. storage.updatePatient takes partial insertPatient which omitted isLocked.
        // I should allow isLocked in updatePatient implementation even if schema omits it for insert.
        // Let's modify storage.updatePatient signature to accept any partial of Patient really, or just handle it.
        // For now, I'll rely on a separate internal update if needed, or better, allow isLocked in the backend update even if not in API input.
        // But type safety... I'll cast updates.
        // Actually, let's just make `updatePatient` accept Partial<Patient> in implementation but keeping interface cleaner.
        // For now, I'll just skip the auto-lock in DB here because I can't set it via `updates` easily without changing types.
        // Wait, I can do a direct DB update for locking.
      }

      // Re-read to check lock logic properly? 
      // Simplified: Just update. The user logic says "Once Paid, it locks". 
      // So if status is Paid, subsequent edits are blocked (checked at start of this handler).
      // But we need to STORE isLocked = true.
      // I'll update schema.ts to include isLocked in insertPatientSchema or make a separate update schema.
      // For now, I will assume the frontend sends status 'Paid', and next time it is locked.
      // But we need the DB to have isLocked=true.
      // I will cheat and cast to any to set isLocked if status is Paid.
      if (input.status === 'Paid') {
        await storage.updatePatient(id, { isLocked: true } as any);
      }

      // Audit Log
      await storage.createAuditLog({
        action: "UPDATE_PATIENT_FINANCIALS",
        entityId: id,
        entityType: "patient",
        userId: Number(user?.id) || 0, // Fallback for safety, though auth middleware ensures user
        details: JSON.stringify(updates)
      });

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Guarantors
  app.get(api.guarantors.list.path, isAuthenticated, async (req, res) => {
    const guarantors = await storage.getGuarantors();
    res.json(guarantors);
  });

  app.post(api.guarantors.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.guarantors.create.input.parse(req.body);
      const guarantor = await storage.createGuarantor(input);
      res.status(201).json(guarantor);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Documents
  app.post(api.documents.upload.path, isAuthenticated, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const patientId = Number(req.body.patientId);
    if (isNaN(patientId)) return res.status(400).json({ message: "Invalid patientId" });

    const patient = await storage.getPatient(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const user = (req as any).user as User;
    if (patient.isLocked && user.role !== 'admin') {
      return res.status(403).json({ message: "File is locked. Cannot upload." });
    }

    try {
      const doc = await storage.createDocument({
        patientId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
      });

      await storage.createAuditLog({
        action: "UPLOAD_DOCUMENT",
        entityId: doc.id,
        entityType: "document",
        userId: Number(user?.id) || 0,
        details: JSON.stringify({ fileName: doc.fileName })
      });

      res.status(201).json(doc);
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.delete(api.documents.delete.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const patient = await storage.getPatient(doc.patientId);
    const user = (req as any).user as User;
    if (patient && patient.isLocked && user.role !== 'admin') {
      return res.status(403).json({ message: "File is locked. Cannot delete." });
    }

    await storage.deleteDocument(id);
    // Optionally delete file from disk
    fs.unlink(doc.filePath, (err) => {
      if (err) console.error("Failed to delete file", err);
    });

    await storage.createAuditLog({
      action: "DELETE_DOCUMENT",
      entityId: id,
      entityType: "document",
      userId: Number((req as any).user?.id) || 0,
      details: JSON.stringify({ fileName: doc.fileName })
    });

    res.status(204).send();
  });

  // Seed Data (if empty)
  const users = await storage.getGuarantors();
  if (users.length === 0) {
    await storage.createGuarantor({ name: "Ministry of Health", contactInfo: "123456", email: "moh@gov.xy", address: "Capital City" });
    await storage.createGuarantor({ name: "Private Insurance Co", contactInfo: "987654", email: "claims@insurance.co", address: "Business District" });
  }

  return httpServer;
}
