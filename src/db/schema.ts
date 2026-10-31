import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  varchar,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const money = (name: string) => numeric(name, { precision: 14, scale: 2, mode: "number" });
const rate = (name: string) => numeric(name, { precision: 14, scale: 4, mode: "number" });
const created = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updated = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

/* ───────────────────────────── Access control ───────────────────────────── */

export const roleKey = pgEnum("role_key", [
  "super_admin",
  "admin",
  "staff",
  "qs",
  "sales_agent",
  "referral_partner",
  "customer",
]);

export const roles = pgTable("roles", {
  key: roleKey("key").primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  description: text("description"),
});

export const permissions = pgTable("permissions", {
  key: varchar("key", { length: 80 }).primaryKey(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleKey: roleKey("role_key")
      .notNull()
      .references(() => roles.key, { onDelete: "cascade" }),
    permissionKey: varchar("permission_key", { length: 80 })
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleKey, t.permissionKey] })],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 200 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    role: roleKey("role").notNull().default("customer"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active | disabled
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email), index("users_role_idx").on(t.role)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(), // sha256 of the cookie token
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: created(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/* ───────────────────────────── CRM ───────────────────────────── */

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    companyName: varchar("company_name", { length: 200 }),
    phone: varchar("phone", { length: 30 }),
    phoneNormalized: varchar("phone_normalized", { length: 20 }),
    email: varchar("email", { length: 200 }),
    address: text("address"),
    segment: varchar("segment", { length: 40 }), // homeowner | company | developer | factory | ...
    notes: text("notes"),
    source: varchar("source", { length: 30 }).default("website"),
    partnerId: integer("partner_id").references(() => partners.id, { onDelete: "set null" }),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    index("customers_phone_idx").on(t.phoneNormalized),
    index("customers_email_idx").on(t.email),
    index("customers_user_idx").on(t.userId),
  ],
);

export const enquiries = pgTable(
  "enquiries",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    name: varchar("name", { length: 160 }).notNull(),
    companyName: varchar("company_name", { length: 200 }),
    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 200 }),
    serviceSlug: varchar("service_slug", { length: 120 }),
    location: varchar("location", { length: 200 }),
    message: text("message").notNull(),
    kind: varchar("kind", { length: 30 }).notNull().default("general"), // general | corporate | site_visit | formal_quote
    status: varchar("status", { length: 20 }).notNull().default("new"), // new | in_progress | closed
    source: varchar("source", { length: 40 }).default("website"),
    landingPage: varchar("landing_page", { length: 200 }),
    createdAt: created(),
  },
  (t) => [index("enquiries_status_idx").on(t.status), index("enquiries_created_idx").on(t.createdAt)],
);

export const communications = pgTable(
  "communications",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
    quotationId: integer("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
    direction: varchar("direction", { length: 10 }).notNull().default("out"), // in | out | note
    channel: varchar("channel", { length: 20 }).notNull().default("note"), // note | phone | whatsapp | email | portal | site_visit
    body: text("body").notNull(),
    visibleToCustomer: boolean("visible_to_customer").notNull().default(false),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: created(),
  },
  (t) => [index("comms_customer_idx").on(t.customerId)],
);

/* ───────────────────────────── Partners ───────────────────────────── */

export const partners = pgTable(
  "partners",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(), // public partner ID, e.g. HMR-7K2P
    type: varchar("type", { length: 20 }).notNull(), // referral | agent
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | suspended | rejected
    area: varchar("area", { length: 160 }),
    occupation: varchar("occupation", { length: 160 }),
    experience: text("experience"),
    payoutBankName: varchar("payout_bank_name", { length: 80 }),
    payoutAccountName: varchar("payout_account_name", { length: 160 }),
    payoutAccountEnc: text("payout_account_enc"), // AES-256-GCM, never returned to the browser in full
    payoutAccountLast4: varchar("payout_account_last4", { length: 4 }),
    agreedTermsAt: timestamp("agreed_terms_at", { withTimezone: true }),
    approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: created(),
  },
  (t) => [uniqueIndex("partners_code_uq").on(t.code), uniqueIndex("partners_user_uq").on(t.userId)],
);

/** Referral link visits (attribution). */
export const referrals = pgTable(
  "referrals",
  {
    id: serial("id").primaryKey(),
    partnerId: integer("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "cascade" }),
    landingPath: varchar("landing_path", { length: 300 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: created(),
  },
  (t) => [index("referrals_partner_idx").on(t.partnerId)],
);

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    partnerId: integer("partner_id").references(() => partners.id, { onDelete: "set null" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    name: varchar("name", { length: 160 }).notNull(),
    companyName: varchar("company_name", { length: 200 }),
    phone: varchar("phone", { length: 30 }).notNull(),
    phoneNormalized: varchar("phone_normalized", { length: 20 }).notNull(),
    email: varchar("email", { length: 200 }),
    location: varchar("location", { length: 200 }),
    serviceCategory: varchar("service_category", { length: 60 }),
    description: text("description"),
    estimatedValue: money("estimated_value"),
    source: varchar("source", { length: 30 }).notNull().default("website"), // website | partner | quotation | whatsapp | walk_in
    status: varchar("status", { length: 20 }).notNull().default("new"),
    // new | verified | duplicate | rejected | follow_up | quoted | won | lost
    duplicateOfId: integer("duplicate_of_id"),
    assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
    statusNote: text("status_note"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    index("leads_phone_idx").on(t.phoneNormalized),
    index("leads_partner_idx").on(t.partnerId),
    index("leads_status_idx").on(t.status),
  ],
);

/* ───────────────────────────── Content ───────────────────────────── */

export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull(),
    groupKey: varchar("group_key", { length: 30 }).notNull(), // building | civil | facilities | ict
    quoteCategory: varchar("quote_category", { length: 40 }), // links to quotation wizard categories
    titleMs: varchar("title_ms", { length: 160 }).notNull(),
    titleEn: varchar("title_en", { length: 160 }).notNull(),
    summaryMs: text("summary_ms").notNull(),
    summaryEn: text("summary_en").notNull(),
    scopeMs: jsonb("scope_ms").$type<string[]>().notNull().default([]),
    scopeEn: jsonb("scope_en").$type<string[]>().notNull().default([]),
    image: varchar("image", { length: 300 }),
    imageIsActual: boolean("image_is_actual").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    active: boolean("active").notNull().default(true),
    updatedAt: updated(),
  },
  (t) => [uniqueIndex("services_slug_uq").on(t.slug), index("services_group_idx").on(t.groupKey)],
);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    titleMs: varchar("title_ms", { length: 300 }).notNull(),
    titleEn: varchar("title_en", { length: 300 }).notNull(),
    category: varchar("category", { length: 40 }).notNull(),
    clientName: varchar("client_name", { length: 200 }),
    clientPublic: boolean("client_public").notNull().default(false),
    role: varchar("role", { length: 80 }), // main contractor | subcontractor | design & build
    location: varchar("location", { length: 200 }),
    value: money("value"),
    valuePublic: boolean("value_public").notNull().default(false),
    duration: varchar("duration", { length: 80 }),
    year: varchar("year", { length: 20 }),
    scopeMs: text("scope_ms"),
    scopeEn: text("scope_en"),
    descriptionMs: text("description_ms"),
    descriptionEn: text("description_en"),
    status: varchar("status", { length: 20 }).notNull().default("completed"), // planned | ongoing | completed | on_hold
    progress: integer("progress").notNull().default(0),
    startDate: date("start_date"),
    endDate: date("end_date"),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    quotationId: integer("quotation_id"),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
    assignedUserIds: jsonb("assigned_user_ids").$type<number[]>().notNull().default([]),
    coverImage: varchar("cover_image", { length: 300 }),
    gallery: jsonb("gallery").$type<{ src: string; captionMs?: string; captionEn?: string; kind?: "before" | "after" | "gallery" }[]>()
      .notNull()
      .default([]),
    isPortfolio: boolean("is_portfolio").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [uniqueIndex("projects_slug_uq").on(t.slug), index("projects_status_idx").on(t.status)],
);

export const projectDocuments = pgTable(
  "project_documents",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
    quotationId: integer("quotation_id").references(() => quotations.id, { onDelete: "cascade" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    storageKey: varchar("storage_key", { length: 300 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 80 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    kind: varchar("kind", { length: 20 }).notNull().default("other"), // photo | drawing | before | after | contract | other
    uploadSession: varchar("upload_session", { length: 64 }), // anonymous wizard uploads, claimed later
    uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: created(),
  },
  (t) => [index("docs_project_idx").on(t.projectId), index("docs_quotation_idx").on(t.quotationId)],
);

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  src: varchar("src", { length: 300 }).notNull(),
  captionMs: varchar("caption_ms", { length: 200 }).notNull(),
  captionEn: varchar("caption_en", { length: 200 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  isActualProject: boolean("is_actual_project").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  company: varchar("company", { length: 200 }),
  textMs: text("text_ms").notNull(),
  textEn: text("text_en"),
  rating: integer("rating"),
  consentToPublish: boolean("consent_to_publish").notNull().default(false),
  active: boolean("active").notNull().default(false),
  createdAt: created(),
});

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    lang: varchar("lang", { length: 2 }).notNull().default("ms"),
    title: varchar("title", { length: 300 }).notNull(),
    excerpt: text("excerpt"),
    body: text("body").notNull(),
    coverImage: varchar("cover_image", { length: 300 }),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | published
    publishedAt: timestamp("published_at", { withTimezone: true }),
    authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [uniqueIndex("blog_slug_lang_uq").on(t.slug, t.lang)],
);

/** Key/value website content and company facts editable by admin. */
export const websiteContent = pgTable("website_content", {
  key: varchar("key", { length: 100 }).primaryKey(),
  valueMs: text("value_ms"),
  valueEn: text("value_en"),
  updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updated(),
});

/* ───────────────────────────── Pricing ───────────────────────────── */

export const pricingItems = pgTable(
  "pricing_items",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 30 }).notNull(),
    description: varchar("description", { length: 300 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(), // trade section, e.g. "D. Cat"
    workCategories: jsonb("work_categories").$type<string[]>().notNull().default([]), // quote category keys
    unit: varchar("unit", { length: 12 }).notNull(),
    materialRate: rate("material_rate").notNull().default(0),
    labourRate: rate("labour_rate").notNull().default(0),
    machineryRate: rate("machinery_rate").notNull().default(0),
    transportRate: rate("transport_rate").notNull().default(0),
    subcontractorRate: rate("subcontractor_rate").notNull().default(0),
    totalBaseRate: rate("total_base_rate").notNull().default(0), // cost basis, sum of the components
    marketLow: rate("market_low"),
    marketHigh: rate("market_high"),
    effectiveDate: date("effective_date").notNull(),
    supplier: varchar("supplier", { length: 200 }),
    source: varchar("source", { length: 200 }),
    notes: text("notes"),
    keywords: text("keywords"),
    isVerified: boolean("is_verified").notNull().default(false),
    active: boolean("active").notNull().default(true),
    updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [uniqueIndex("pricing_code_uq").on(t.code), index("pricing_active_idx").on(t.active)],
);

export const pricingItemHistory = pgTable(
  "pricing_item_history",
  {
    id: serial("id").primaryKey(),
    pricingItemId: integer("pricing_item_id")
      .notNull()
      .references(() => pricingItems.id, { onDelete: "cascade" }),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    reason: varchar("reason", { length: 200 }),
    changedBy: integer("changed_by").references(() => users.id, { onDelete: "set null" }),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("pricing_hist_item_idx").on(t.pricingItemId)],
);

const libraryCols = {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  unit: varchar("unit", { length: 12 }).notNull(),
  rate: rate("rate").notNull(),
  supplier: varchar("supplier", { length: 200 }),
  effectiveDate: date("effective_date").notNull(),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
};

export const materialPrices = pgTable("material_prices", { ...libraryCols }, (t) => [uniqueIndex("material_code_uq").on(t.code)]);
export const labourRates = pgTable("labour_rates", { ...libraryCols }, (t) => [uniqueIndex("labour_code_uq").on(t.code)]);
export const machineryRates = pgTable(
  "machinery_rates",
  { ...libraryCols, withOperator: boolean("with_operator").notNull().default(true) },
  (t) => [uniqueIndex("machinery_code_uq").on(t.code)],
);

/** Scalar pricing settings: margins, SST, contingency, range widths. */
export const pricingSettings = pgTable("pricing_settings", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: numeric("value", { precision: 12, scale: 4, mode: "number" }).notNull(),
  description: text("description"),
  updatedAt: updated(),
});

export const minimumCharges = pgTable("minimum_charges", {
  categoryKey: varchar("category_key", { length: 40 }).primaryKey(),
  amount: money("amount").notNull(),
});

export const locationAdjustments = pgTable("location_adjustments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  keywords: jsonb("keywords").$type<string[]>().notNull().default([]), // matched against project location, lower-case
  factor: numeric("factor", { precision: 6, scale: 4, mode: "number" }).notNull().default(1),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const additionalCharges = pgTable("additional_charges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  kind: varchar("kind", { length: 10 }).notNull(), // fixed | percent
  amount: rate("amount").notNull(),
  appliesTo: jsonb("applies_to").$type<string[]>().notNull().default([]), // empty = all categories
  segment: varchar("segment", { length: 20 }).notNull().default("all"), // all | residential | commercial
  active: boolean("active").notNull().default(true),
});

/* ───────────────────────────── Quotations ───────────────────────────── */

export const quotations = pgTable(
  "quotations",
  {
    id: serial("id").primaryKey(),
    number: varchar("number", { length: 30 }).notNull(),
    publicToken: varchar("public_token", { length: 64 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    // draft | preliminary | pending_qs | approved | sent | accepted | rejected | expired | cancelled
    source: varchar("source", { length: 20 }).notNull().default("ai"), // ai | manual
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
    partnerId: integer("partner_id").references(() => partners.id, { onDelete: "set null" }),
    category: varchar("category", { length: 40 }).notNull(),
    segment: varchar("segment", { length: 20 }).notNull().default("residential"), // residential | commercial
    title: varchar("title", { length: 300 }).notNull(),
    projectLocation: varchar("project_location", { length: 300 }),
    projectAddress: text("project_address"),
    inputs: jsonb("inputs").$type<Record<string, unknown>>().notNull().default({}),
    aiAnalysis: jsonb("ai_analysis").$type<Record<string, unknown>>(),
    calcSnapshot: jsonb("calc_snapshot").$type<Record<string, unknown>>(), // internal breakdown, admin only
    overridesJson: jsonb("overrides").$type<Record<string, number>>().notNull().default({}), // project-specific pricing
    subtotal: money("subtotal").notNull().default(0),
    additionalTotal: money("additional_total").notNull().default(0),
    contingency: money("contingency").notNull().default(0),
    sst: money("sst").notNull().default(0),
    grandTotal: money("grand_total").notNull().default(0),
    rangeLow: money("range_low"),
    rangeHigh: money("range_high"),
    requiresSiteInspection: boolean("requires_site_inspection").notNull().default(true),
    pendingReviewCount: integer("pending_review_count").notNull().default(0),
    validityDays: integer("validity_days").notNull().default(30),
    issueDate: date("issue_date").notNull(),
    validUntil: date("valid_until").notNull(),
    terms: text("terms"),
    notes: text("notes"),
    formalRequestedAt: timestamp("formal_requested_at", { withTimezone: true }),
    siteVisitRequestedAt: timestamp("site_visit_requested_at", { withTimezone: true }),
    approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    uniqueIndex("quotations_number_uq").on(t.number),
    uniqueIndex("quotations_token_uq").on(t.publicToken),
    index("quotations_status_idx").on(t.status),
    index("quotations_customer_idx").on(t.customerId),
  ],
);

export const quotationItems = pgTable(
  "quotation_items",
  {
    id: serial("id").primaryKey(),
    quotationId: integer("quotation_id")
      .notNull()
      .references(() => quotations.id, { onDelete: "cascade" }),
    sort: integer("sort").notNull().default(0),
    pricingItemId: integer("pricing_item_id").references(() => pricingItems.id, { onDelete: "set null" }),
    code: varchar("code", { length: 30 }),
    description: text("description").notNull(),
    unit: varchar("unit", { length: 12 }).notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 3, mode: "number" }),
    costRate: rate("cost_rate"), // internal
    rate: money("rate"), // customer-facing selling rate
    amount: money("amount"),
    status: varchar("status", { length: 20 }).notNull().default("priced"), // priced | needs_review | excluded
    reviewReason: text("review_reason"),
    quantityBasis: text("quantity_basis"),
  },
  (t) => [index("qitems_quotation_idx").on(t.quotationId)],
);

/* ───────────────────────────── Commission & payments ───────────────────────────── */

export const commissionRules = pgTable("commission_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  partnerType: varchar("partner_type", { length: 20 }).notNull().default("all"), // all | referral | agent
  serviceCategory: varchar("service_category", { length: 40 }), // null = any
  minProjectValue: money("min_project_value"),
  maxProjectValue: money("max_project_value"),
  kind: varchar("kind", { length: 10 }).notNull(), // fixed | percent
  amount: rate("amount").notNull(),
  capAmount: money("cap_amount"),
  campaignBonus: money("campaign_bonus").notNull().default(0),
  // Commission tranches released when cumulative verified client payments reach a % of project value.
  milestones: jsonb("milestones")
    .$type<{ paymentPct: number; commissionPct: number }[]>()
    .notNull()
    .default([{ paymentPct: 100, commissionPct: 100 }]),
  validFrom: date("valid_from"),
  validTo: date("valid_to"),
  priority: integer("priority").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: created(),
});

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    kind: varchar("kind", { length: 20 }).notNull(), // client_receipt | partner_payout
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    partnerId: integer("partner_id").references(() => partners.id, { onDelete: "set null" }),
    amount: money("amount").notNull(),
    reference: varchar("reference", { length: 120 }),
    milestone: varchar("milestone", { length: 120 }),
    paidAt: date("paid_at").notNull(),
    verifiedBy: integer("verified_by").references(() => users.id, { onDelete: "set null" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: created(),
  },
  (t) => [index("payments_project_idx").on(t.projectId), index("payments_partner_idx").on(t.partnerId)],
);

export const commissionTransactions = pgTable(
  "commission_transactions",
  {
    id: serial("id").primaryKey(),
    partnerId: integer("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "cascade" }),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
    ruleId: integer("rule_id").references(() => commissionRules.id, { onDelete: "set null" }),
    trancheNo: integer("tranche_no").notNull().default(1),
    baseValue: money("base_value").notNull(),
    amount: money("amount").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    // pending (project secured, waiting payment) | eligible | approved | paid | cancelled
    eligibleAt: timestamp("eligible_at", { withTimezone: true }),
    approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    paymentId: integer("payment_id").references(() => payments.id, { onDelete: "set null" }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    note: text("note"),
    createdAt: created(),
  },
  (t) => [
    index("comm_partner_idx").on(t.partnerId),
    uniqueIndex("comm_project_tranche_uq").on(t.projectId, t.partnerId, t.trancheNo),
  ],
);

/* ───────────────────────────── AI, notifications, audit ───────────────────────────── */

export const aiUsageLogs = pgTable(
  "ai_usage_logs",
  {
    id: serial("id").primaryKey(),
    requestId: varchar("request_id", { length: 80 }),
    provider: varchar("provider", { length: 20 }).notNull(),
    model: varchar("model", { length: 80 }).notNull(),
    purpose: varchar("purpose", { length: 40 }).notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    quotationId: integer("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    costUsd: numeric("cost_usd", { precision: 10, scale: 5, mode: "number" }).notNull().default(0),
    latencyMs: integer("latency_ms"),
    status: varchar("status", { length: 20 }).notNull(), // ok | invalid_output | refusal | error | blocked
    error: text("error"),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: created(),
  },
  (t) => [index("ai_logs_created_idx").on(t.createdAt), index("ai_logs_status_idx").on(t.status)],
);

/** Admin-editable AI settings that override env defaults (the API key itself stays in env only). */
export const aiSettings = pgTable("ai_settings", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: updated(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    channel: varchar("channel", { length: 20 }).notNull().default("in_app"), // in_app | email | whatsapp
    recipient: varchar("recipient", { length: 200 }),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    link: varchar("link", { length: 300 }),
    status: varchar("status", { length: 20 }).notNull().default("queued"), // queued | sent | failed | skipped | read
    error: text("error"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: created(),
  },
  (t) => [index("notif_user_idx").on(t.userId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 80 }).notNull(),
    entity: varchar("entity", { length: 60 }).notNull(),
    entityId: varchar("entity_id", { length: 60 }),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: created(),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId), index("audit_created_idx").on(t.createdAt)],
);

export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 200 }).primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
});

export const counters = pgTable("counters", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: integer("value").notNull().default(0),
});

/* ───────────────────────────── Relations ───────────────────────────── */

export const quotationRelations = relations(quotations, ({ many, one }) => ({
  items: many(quotationItems),
  customer: one(customers, { fields: [quotations.customerId], references: [customers.id] }),
  partner: one(partners, { fields: [quotations.partnerId], references: [partners.id] }),
}));
export const quotationItemRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationItems.quotationId], references: [quotations.id] }),
}));
export const partnerRelations = relations(partners, ({ one, many }) => ({
  user: one(users, { fields: [partners.userId], references: [users.id] }),
  leads: many(leads),
  commissions: many(commissionTransactions),
}));
export const leadRelations = relations(leads, ({ one }) => ({
  partner: one(partners, { fields: [leads.partnerId], references: [partners.id] }),
  customer: one(customers, { fields: [leads.customerId], references: [customers.id] }),
}));
export const customerRelations = relations(customers, ({ many, one }) => ({
  quotations: many(quotations),
  enquiries: many(enquiries),
  communications: many(communications),
  user: one(users, { fields: [customers.userId], references: [users.id] }),
}));
export const enquiryRelations = relations(enquiries, ({ one }) => ({
  customer: one(customers, { fields: [enquiries.customerId], references: [customers.id] }),
}));
export const communicationRelations = relations(communications, ({ one }) => ({
  customer: one(customers, { fields: [communications.customerId], references: [customers.id] }),
  user: one(users, { fields: [communications.userId], references: [users.id] }),
}));
export const commissionTxRelations = relations(commissionTransactions, ({ one }) => ({
  partner: one(partners, { fields: [commissionTransactions.partnerId], references: [partners.id] }),
  project: one(projects, { fields: [commissionTransactions.projectId], references: [projects.id] }),
  rule: one(commissionRules, { fields: [commissionTransactions.ruleId], references: [commissionRules.id] }),
}));
