Repository overview

- Monorepo: server (Express + TypeScript + Drizzle) + client (Vite + React + TypeScript).
- Server serves API and (in dev) runs Vite middleware; production bundles server via esbuild (see `script/build.ts`).
- DB: Postgres in production (driven by `DATABASE_URL`), **SQLite dev fallback** when `DATABASE_URL` is not set (file `dev.db`). See `server/db.ts`.
- Auth: Local username/password auth (POST `/api/login`, POST `/api/logout`, GET `/api/auth/user`). Default admin seeded: `admin` / `1234` (change immediately). See `server/replit_integrations/auth/*` and `shared/models/auth.ts`.

What to edit for common tasks

- Change API shape or validation:
  - `shared/routes.ts` (Zod route definitions) — canonical contract used by client/server.
  - `shared/schema.ts` (Drizzle table definitions + Zod insert schemas) — authoritative DB schema.

- Change DB behavior or schema:
  - `server/db.ts` — chooses Postgres vs SQLite; update this file if you change DB adapter behavior.
  - Run `npm run db:push` (drizzle-kit) to apply schema changes to a connected Postgres DB.

- Authentication changes:
  - `server/replit_integrations/auth/replitAuth.ts` — main session/login code (now implements local auth).
  - `server/replit_integrations/auth/storage.ts` — user lookup/upsert methods (add lookups here).
  - `shared/models/auth.ts` — user fields (now includes `username` and `passwordHash`).
  - `client/src/pages/Landing.tsx` — login form (POST `/api/login`).
  - `client/src/hooks/use-auth.ts` — fetch current user and logout flow.

Dev & troubleshooting notes

- Local dev quick-start:
  1. npm install
  2. npm run dev
  3. Visit `http://localhost:5000` and sign in with `admin` / `1234` (or set `DEFAULT_ADMIN_PASSWORD` env).

- Sessions:
  - If `DATABASE_URL` is set, sessions use Postgres-backed store (connect-pg-simple).
  - Without `DATABASE_URL`, the app uses the in-memory session store (development only).

- Security notes:
  - Passwords are hashed with bcrypt. The default admin user is only seeded for convenience in local/dev environments — do not use these credentials in production.
  - Any change to `users` table (username/password fields) must be followed by a schema migration (`npm run db:push`) when using Postgres.

Useful patterns & conventions

- Shared Zod types + Drizzle schemas are the single source of truth for validation and typing — prefer changing `shared/*` first.
- Routes are declared in `shared/routes.ts` and implemented in `server/routes.ts`; client uses `buildUrl` from the same file to call APIs.
- Client uses `fetch(..., { credentials: 'include' })` for auth-protected endpoints; preserve `credentials: 'include'` on requests.

If anything in these instructions is unclear or you want more detail (e.g., code patches for a specific change), tell me which area and I will modify this file or open a branch with the fix.
