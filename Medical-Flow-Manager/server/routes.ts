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
    const user = req.user as User;
    if (existing.isLocked && user.role !== 'admin') {
        return res.status(403).json({ message: "File is locked. Only admin can edit." });
    }

    try {
      const input = api.patients.update.input.parse(req.body);
      
      // Auto-lock logic
      let updates = { ...input };
      if (input.status === 'Paid' && !existing.isLocked) {
      }
      
      const updated = await storage.updatePatient(id, updates);

      if (input.status === 'Paid') {
          await storage.updatePatient(id, { isLocked: true } as any);
      }
      
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

    const user = req.user as User;
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
      res.status(201).json(doc);
    } catch (err) {
      res.status(500).json({ message: "Upload failed" });
    }
  });


  app.get("/api/documents/:id/download", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const filePath = path.resolve(doc.filePath);
    if (!filePath.startsWith(path.resolve("uploads"))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.setHeader("Content-Type", doc.fileType);
    res.setHeader("Content-Disposition", `inline; filename="${doc.fileName}"`);
    fs.createReadStream(filePath).pipe(res);
  });

  app.delete(api.documents.delete.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const patient = await storage.getPatient(doc.patientId);
    const user = req.user as User;
    if (patient && patient.isLocked && user.role !== 'admin') {
        return res.status(403).json({ message: "File is locked. Cannot delete." });
    }

    await storage.deleteDocument(id);
    // Optionally delete file from disk
    fs.unlink(doc.filePath, (err) => {
        if (err) console.error("Failed to delete file", err);
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
