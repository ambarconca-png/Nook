ALTER TABLE "routines" ADD COLUMN "category" text DEFAULT 'Alltag' NOT NULL;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "rhythm" text DEFAULT 'flexible' NOT NULL;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "period" text DEFAULT 'week' NOT NULL;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "amount" integer;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "unit" text DEFAULT 'Einheit' NOT NULL;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "preferred_weekdays" text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "reminder_time" text;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "color" text DEFAULT 'teal' NOT NULL;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "symbol" text DEFAULT 'repeat' NOT NULL;