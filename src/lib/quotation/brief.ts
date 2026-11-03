import { z } from "zod";
import { isValidMyPhone } from "@/lib/phone";

const s = (max: number) => z.string().trim().max(max).optional().default("");

/** Wizard step 1-3 fields. Customer name and phone are kept for the record but never sent to the AI provider. */
export const BriefInput = z.object({
  lang: z.enum(["ms", "en"]).default("ms"),
  categoryKey: z.string().trim().min(2).max(40),
  work: z.string().trim().min(2).max(200),
  customerName: z.string().trim().min(2).max(160),
  customerPhone: z.string().trim().max(30).refine(isValidMyPhone, "No. telefon tidak sah"),
  location: z.string().trim().min(2).max(200),
  projectType: s(120),
  buildingType: s(120),
  measurements: s(2000),
  quantity: s(500),
  materialPreference: s(1000),
  specifications: s(2000),
  siteConditions: s(1000),
  timeline: s(200),
  remarks: s(3000),
  uploadIds: z.array(z.number().int().positive()).max(10).optional().default([]),
  turnstileToken: z.string().max(4000).optional(),
  website: z.string().max(0).optional().default(""), // honeypot
});
export type BriefInput = z.infer<typeof BriefInput>;

export const ContactInput = z.object({
  fullName: z.string().trim().min(2).max(160),
  companyName: s(200),
  phone: z.string().trim().min(8).max(30),
  email: z.union([z.string().trim().email().max(200), z.literal("")]).optional().default(""),
  projectAddress: s(500),
  projectDescription: s(3000),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(""),
});

export const RefineInput = z.object({
  answers: z
    .array(z.object({ question: z.string().trim().min(1).max(500), answer: z.string().trim().max(1000) }))
    .min(1)
    .max(8),
});

export const RequestInput = z.object({
  kind: z.enum(["formal", "site_visit"]),
  preferredDate: s(40),
  notes: s(1000),
});
