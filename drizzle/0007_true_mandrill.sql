CREATE TABLE "tracking_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracker_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"data" text DEFAULT '{}' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking_trackers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"input_type" text,
	"unit" text,
	"options" text DEFAULT '[]' NOT NULL,
	"color" text DEFAULT 'violet' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracking_entries" ADD CONSTRAINT "tracking_entries_tracker_id_tracking_trackers_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."tracking_trackers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_entries" ADD CONSTRAINT "tracking_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_trackers" ADD CONSTRAINT "tracking_trackers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tracking_entries_user_started_idx" ON "tracking_entries" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "tracking_entries_tracker_id_idx" ON "tracking_entries" USING btree ("tracker_id");--> statement-breakpoint
CREATE INDEX "tracking_trackers_user_id_idx" ON "tracking_trackers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_tracker_type_name_unique" ON "tracking_trackers" USING btree ("user_id","type","name");