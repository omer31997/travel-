import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Session storage table.
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(), // json mode not directly supported in generic text, but usually just text in simple session stores or jsonb
  expire: timestamp("expire").notNull(),
});

// User storage table.
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash"),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").default("employee").notNull(), // 'admin' | 'employee'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

