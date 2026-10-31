CREATE TYPE "public"."role_key" AS ENUM('super_admin', 'admin', 'staff', 'qs', 'sales_agent', 'referral_partner', 'customer');--> statement-breakpoint
CREATE TABLE "additional_charges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"kind" varchar(10) NOT NULL,
	"amount" numeric(14, 4) NOT NULL,
	"applies_to" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"segment" varchar(20) DEFAULT 'all' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_settings" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" varchar(80),
	"provider" varchar(20) NOT NULL,
	"model" varchar(80) NOT NULL,
	"purpose" varchar(40) NOT NULL,
	"user_id" integer,
	"quotation_id" integer,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cache_read_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(10, 5) DEFAULT 0 NOT NULL,
	"latency_ms" integer,
	"status" varchar(20) NOT NULL,
	"error" text,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" varchar(80) NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" varchar(60),
	"meta" jsonb,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"lang" varchar(2) DEFAULT 'ms' NOT NULL,
	"title" varchar(300) NOT NULL,
	"excerpt" text,
	"body" text NOT NULL,
	"cover_image" varchar(300),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"author_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"partner_type" varchar(20) DEFAULT 'all' NOT NULL,
	"service_category" varchar(40),
	"min_project_value" numeric(14, 2),
	"max_project_value" numeric(14, 2),
	"kind" varchar(10) NOT NULL,
	"amount" numeric(14, 4) NOT NULL,
	"cap_amount" numeric(14, 2),
	"campaign_bonus" numeric(14, 2) DEFAULT 0 NOT NULL,
	"milestones" jsonb DEFAULT '[{"paymentPct":100,"commissionPct":100}]'::jsonb NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"priority" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" integer NOT NULL,
	"lead_id" integer,
	"project_id" integer,
	"rule_id" integer,
	"tranche_no" integer DEFAULT 1 NOT NULL,
	"base_value" numeric(14, 2) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"eligible_at" timestamp with time zone,
	"approved_by" integer,
	"approved_at" timestamp with time zone,
	"payment_id" integer,
	"paid_at" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"lead_id" integer,
	"quotation_id" integer,
	"direction" varchar(10) DEFAULT 'out' NOT NULL,
	"channel" varchar(20) DEFAULT 'note' NOT NULL,
	"body" text NOT NULL,
	"visible_to_customer" boolean DEFAULT false NOT NULL,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"full_name" varchar(160) NOT NULL,
	"company_name" varchar(200),
	"phone" varchar(30),
	"phone_normalized" varchar(20),
	"email" varchar(200),
	"address" text,
	"segment" varchar(40),
	"notes" text,
	"source" varchar(30) DEFAULT 'website',
	"partner_id" integer,
	"consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"name" varchar(160) NOT NULL,
	"company_name" varchar(200),
	"phone" varchar(30) NOT NULL,
	"email" varchar(200),
	"service_slug" varchar(120),
	"location" varchar(200),
	"message" text NOT NULL,
	"kind" varchar(30) DEFAULT 'general' NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"source" varchar(40) DEFAULT 'website',
	"landing_page" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"src" varchar(300) NOT NULL,
	"caption_ms" varchar(200) NOT NULL,
	"caption_en" varchar(200) NOT NULL,
	"category" varchar(40) NOT NULL,
	"is_actual_project" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labour_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(200) NOT NULL,
	"unit" varchar(12) NOT NULL,
	"rate" numeric(14, 4) NOT NULL,
	"supplier" varchar(200),
	"effective_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" integer,
	"customer_id" integer,
	"name" varchar(160) NOT NULL,
	"company_name" varchar(200),
	"phone" varchar(30) NOT NULL,
	"phone_normalized" varchar(20) NOT NULL,
	"email" varchar(200),
	"location" varchar(200),
	"service_category" varchar(60),
	"description" text,
	"estimated_value" numeric(14, 2),
	"source" varchar(30) DEFAULT 'website' NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"duplicate_of_id" integer,
	"assigned_to" integer,
	"status_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"factor" numeric(6, 4) DEFAULT 1 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machinery_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(200) NOT NULL,
	"unit" varchar(12) NOT NULL,
	"rate" numeric(14, 4) NOT NULL,
	"supplier" varchar(200),
	"effective_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"with_operator" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(200) NOT NULL,
	"unit" varchar(12) NOT NULL,
	"rate" numeric(14, 4) NOT NULL,
	"supplier" varchar(200),
	"effective_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "minimum_charges" (
	"category_key" varchar(40) PRIMARY KEY NOT NULL,
	"amount" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"channel" varchar(20) DEFAULT 'in_app' NOT NULL,
	"recipient" varchar(200),
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"link" varchar(300),
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"error" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code" varchar(20) NOT NULL,
	"type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"area" varchar(160),
	"occupation" varchar(160),
	"experience" text,
	"payout_bank_name" varchar(80),
	"payout_account_name" varchar(160),
	"payout_account_enc" text,
	"payout_account_last4" varchar(4),
	"agreed_terms_at" timestamp with time zone,
	"approved_by" integer,
	"approved_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" varchar(20) NOT NULL,
	"project_id" integer,
	"partner_id" integer,
	"amount" numeric(14, 2) NOT NULL,
	"reference" varchar(120),
	"milestone" varchar(120),
	"paid_at" date NOT NULL,
	"verified_by" integer,
	"verified_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "pricing_item_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"pricing_item_id" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"reason" varchar(200),
	"changed_by" integer,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"description" varchar(300) NOT NULL,
	"category" varchar(80) NOT NULL,
	"work_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unit" varchar(12) NOT NULL,
	"material_rate" numeric(14, 4) DEFAULT 0 NOT NULL,
	"labour_rate" numeric(14, 4) DEFAULT 0 NOT NULL,
	"machinery_rate" numeric(14, 4) DEFAULT 0 NOT NULL,
	"transport_rate" numeric(14, 4) DEFAULT 0 NOT NULL,
	"subcontractor_rate" numeric(14, 4) DEFAULT 0 NOT NULL,
	"total_base_rate" numeric(14, 4) DEFAULT 0 NOT NULL,
	"market_low" numeric(14, 4),
	"market_high" numeric(14, 4),
	"effective_date" date NOT NULL,
	"supplier" varchar(200),
	"source" varchar(200),
	"notes" text,
	"keywords" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_settings" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"value" numeric(12, 4) NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"quotation_id" integer,
	"customer_id" integer,
	"storage_key" varchar(300) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(80) NOT NULL,
	"size_bytes" integer NOT NULL,
	"kind" varchar(20) DEFAULT 'other' NOT NULL,
	"upload_session" varchar(64),
	"uploaded_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title_ms" varchar(300) NOT NULL,
	"title_en" varchar(300) NOT NULL,
	"category" varchar(40) NOT NULL,
	"client_name" varchar(200),
	"client_public" boolean DEFAULT false NOT NULL,
	"role" varchar(80),
	"location" varchar(200),
	"value" numeric(14, 2),
	"value_public" boolean DEFAULT false NOT NULL,
	"duration" varchar(80),
	"year" varchar(20),
	"scope_ms" text,
	"scope_en" text,
	"description_ms" text,
	"description_en" text,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"start_date" date,
	"end_date" date,
	"customer_id" integer,
	"quotation_id" integer,
	"lead_id" integer,
	"assigned_user_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_image" varchar(300),
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_portfolio" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_id" integer NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"pricing_item_id" integer,
	"code" varchar(30),
	"description" text NOT NULL,
	"unit" varchar(12) NOT NULL,
	"quantity" numeric(14, 3),
	"cost_rate" numeric(14, 4),
	"rate" numeric(14, 2),
	"amount" numeric(14, 2),
	"status" varchar(20) DEFAULT 'priced' NOT NULL,
	"review_reason" text,
	"quantity_basis" text
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" varchar(30) NOT NULL,
	"public_token" varchar(64) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"source" varchar(20) DEFAULT 'ai' NOT NULL,
	"customer_id" integer,
	"lead_id" integer,
	"partner_id" integer,
	"category" varchar(40) NOT NULL,
	"segment" varchar(20) DEFAULT 'residential' NOT NULL,
	"title" varchar(300) NOT NULL,
	"project_location" varchar(300),
	"project_address" text,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_analysis" jsonb,
	"calc_snapshot" jsonb,
	"overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT 0 NOT NULL,
	"additional_total" numeric(14, 2) DEFAULT 0 NOT NULL,
	"contingency" numeric(14, 2) DEFAULT 0 NOT NULL,
	"sst" numeric(14, 2) DEFAULT 0 NOT NULL,
	"grand_total" numeric(14, 2) DEFAULT 0 NOT NULL,
	"range_low" numeric(14, 2),
	"range_high" numeric(14, 2),
	"requires_site_inspection" boolean DEFAULT true NOT NULL,
	"pending_review_count" integer DEFAULT 0 NOT NULL,
	"validity_days" integer DEFAULT 30 NOT NULL,
	"issue_date" date NOT NULL,
	"valid_until" date NOT NULL,
	"terms" text,
	"notes" text,
	"formal_requested_at" timestamp with time zone,
	"site_visit_requested_at" timestamp with time zone,
	"approved_by" integer,
	"approved_at" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" varchar(200) PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" integer NOT NULL,
	"landing_path" varchar(300),
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_key" "role_key" NOT NULL,
	"permission_key" varchar(80) NOT NULL,
	CONSTRAINT "role_permissions_role_key_permission_key_pk" PRIMARY KEY("role_key","permission_key")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"key" "role_key" PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"group_key" varchar(30) NOT NULL,
	"quote_category" varchar(40),
	"title_ms" varchar(160) NOT NULL,
	"title_en" varchar(160) NOT NULL,
	"summary_ms" text NOT NULL,
	"summary_en" text NOT NULL,
	"scope_ms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scope_en" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image" varchar(300),
	"image_is_actual" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_hash" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"company" varchar(200),
	"text_ms" text NOT NULL,
	"text_en" text,
	"rating" integer,
	"consent_to_publish" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(200) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(30),
	"role" "role_key" DEFAULT 'customer' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_content" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value_ms" text,
	"value_en" text,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_rule_id_commission_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."commission_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_transactions" ADD CONSTRAINT "commission_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_item_history" ADD CONSTRAINT "pricing_item_history_pricing_item_id_pricing_items_id_fk" FOREIGN KEY ("pricing_item_id") REFERENCES "public"."pricing_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_item_history" ADD CONSTRAINT "pricing_item_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_items" ADD CONSTRAINT "pricing_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_pricing_item_id_pricing_items_id_fk" FOREIGN KEY ("pricing_item_id") REFERENCES "public"."pricing_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_key_roles_key_fk" FOREIGN KEY ("role_key") REFERENCES "public"."roles"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_key_permissions_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permissions"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_content" ADD CONSTRAINT "website_content_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_logs_created_idx" ON "ai_usage_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_logs_status_idx" ON "ai_usage_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_slug_lang_uq" ON "blog_posts" USING btree ("slug","lang");--> statement-breakpoint
CREATE INDEX "comm_partner_idx" ON "commission_transactions" USING btree ("partner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comm_project_tranche_uq" ON "commission_transactions" USING btree ("project_id","partner_id","tranche_no");--> statement-breakpoint
CREATE INDEX "comms_customer_idx" ON "communications" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_user_idx" ON "customers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "enquiries_created_idx" ON "enquiries" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "labour_code_uq" ON "labour_rates" USING btree ("code");--> statement-breakpoint
CREATE INDEX "leads_phone_idx" ON "leads" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "leads_partner_idx" ON "leads" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "machinery_code_uq" ON "machinery_rates" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "material_code_uq" ON "material_prices" USING btree ("code");--> statement-breakpoint
CREATE INDEX "notif_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partners_code_uq" ON "partners" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "partners_user_uq" ON "partners" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_project_idx" ON "payments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "payments_partner_idx" ON "payments" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "pricing_hist_item_idx" ON "pricing_item_history" USING btree ("pricing_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pricing_code_uq" ON "pricing_items" USING btree ("code");--> statement-breakpoint
CREATE INDEX "pricing_active_idx" ON "pricing_items" USING btree ("active");--> statement-breakpoint
CREATE INDEX "docs_project_idx" ON "project_documents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "docs_quotation_idx" ON "project_documents" USING btree ("quotation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_uq" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "qitems_quotation_idx" ON "quotation_items" USING btree ("quotation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotations_number_uq" ON "quotations" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "quotations_token_uq" ON "quotations" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "quotations_status_idx" ON "quotations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotations_customer_idx" ON "quotations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "referrals_partner_idx" ON "referrals" USING btree ("partner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "services_slug_uq" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "services_group_idx" ON "services" USING btree ("group_key");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");