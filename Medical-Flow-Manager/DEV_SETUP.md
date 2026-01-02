# Local Development Setup (SQLite + Local Auth)

This project supports a local SQLite fallback for development and a built-in username/password auth flow.

Quick start (recommended):

1. Install dependencies:
   npm install

2. (Optional) Override default admin password via env:
   DEFAULT_ADMIN_PASSWORD=yourpassword

3. Start development server:
   npm run dev

What to expect:
- If `DATABASE_URL` is not provided, the server will use a local SQLite database file `dev.db`.
- On first run the server will ensure a default admin user exists:
  - username: `admin`
  - password: `1234` (or whatever you set with `DEFAULT_ADMIN_PASSWORD`)
  - Change this password immediately for security.

DB migrations:
- The schema has been updated to include `username` and `password_hash` on the `users` table.
- To apply schema changes to a real DB (Postgres), run:
  npm run db:push

Session store:
- If `DATABASE_URL` points to Postgres, sessions use a Postgres-backed store.
- If no `DATABASE_URL` is provided, the server uses the in-memory session store (safe for local dev only).

Auth endpoints:
- POST /api/login — { username, password }
- POST /api/logout
- GET /api/auth/user — returns the current user

Client changes:
- The landing page now includes a username/password sign-in form.

Notes & security:
- Passwords are hashed with bcrypt. The default admin is seeded for convenience in local dev; **do not** use default credentials in production.
