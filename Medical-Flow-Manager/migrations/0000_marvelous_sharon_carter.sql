CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"entity_id" integer NOT NULL,
	"entity_type" text NOT NULL,
	"user_id" integer,
	"details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_type" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guarantors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_info" text,
	"email" text,
	"address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"passport_number" text NOT NULL,
	"medical_reports" text,
	"destination" text,
	"guarantor_id" integer,
	"status" text DEFAULT 'New' NOT NULL,
	"is_locked" boolean DEFAULT false,
	"total_cost" integer DEFAULT 0,
	"amount_paid" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text,
	"email" text,
	"first_name" text,
	"last_name" text,
	"profile_image_url" text,
	"role" text DEFAULT 'employee' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_guarantor_id_guarantors_id_fk" FOREIGN KEY ("guarantor_id") REFERENCES "public"."guarantors"("id") ON DELETE no action ON UPDATE no action;