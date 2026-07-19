CREATE TABLE "knowledge_project_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '{}' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_project_blocks" ADD CONSTRAINT "knowledge_project_blocks_page_id_knowledge_project_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."knowledge_project_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_project_blocks" ADD CONSTRAINT "knowledge_project_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_project_blocks_page_id_idx" ON "knowledge_project_blocks" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "knowledge_project_blocks_user_id_idx" ON "knowledge_project_blocks" USING btree ("user_id");