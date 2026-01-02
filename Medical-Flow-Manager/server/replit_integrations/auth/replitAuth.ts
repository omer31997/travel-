import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });

    return session({
      secret: process.env.SESSION_SECRET || "default-secret",
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: sessionTtl,
      },
    });
  }

  // Local dev: use built-in memory store (not for production)
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Local username/password login
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });

    const user = await authStorage.getUserByUsername(username);
    if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // Set session user minimal info
    (req as any).session.user = { id: user.id, username: user.username, role: user.role };

    res.json({ id: user.id, username: user.username, role: user.role, email: user.email });
  });

  app.post("/api/logout", (req, res) => {
    const sess = (req as any).session;
    if (sess) {
      sess.destroy((err: any) => {
        if (err) {
          console.error("Failed to destroy session", err);
        }
      });
    }
    res.status(204).send();
  });

  // Ensure default admin exists in local/dev environments
  try {
    const admin = await authStorage.getUserByUsername("admin");
    if (!admin) {
      const password = process.env.DEFAULT_ADMIN_PASSWORD || "1234";
      const hash = await bcrypt.hash(password, 10);
      await authStorage.createUser({ username: "admin", passwordHash: hash, role: "admin" } as any);
      console.log("Created default admin user: username=admin password=1234 (change immediately)");
    }
  } catch (err) {
    console.warn("Could not ensure admin user exists:", err);
  }
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const sessionUser = (req as any).session?.user;
  if (!sessionUser) return res.status(401).json({ message: "Unauthorized" });
  // attach minimal user info to req.user for compatibility
  (req as any).user = sessionUser;
  return next();
};
