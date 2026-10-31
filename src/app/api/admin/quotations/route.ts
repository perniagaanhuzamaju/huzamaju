import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { quoteCategory } from "@/lib/catalog";
import { audit } from "@/lib/audit";
import { createAiQuotation } from "@/lib/quotation/service";

const Body = z.object({
  categoryKey: z.string(),
  title: z.string().trim().min(2).max(300),
  location: z.string().trim().max(200).optional().default(""),
  segment: z.enum(["residential", "commercial"]),
  customerId: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  lang: z.enum(["ms", "en"]).default("ms"),
});

/** Manual quotation prepared by QS; items are added in the editor and priced from the database. */
export const POST = handle(async (req: Request) => {
  const u = await requirePermission("quotations.edit");
  const b = Body.parse(await req.json());
  if (!quoteCategory(b.categoryKey)) throw new HttpError(400, "Kategori tidak sah");
  const created = await createAiQuotation({
    inputs: { lang: b.lang, categoryKey: b.categoryKey, work: b.title, location: b.location, projectType: "", buildingType: "", measurements: "", quantity: "", materialPreference: "", specifications: "", siteConditions: "", timeline: "", remarks: "", answers: [], uploadIds: [], refinements: 2 },
    title: b.title,
    segment: b.segment,
    estimate: { project_category: b.categoryKey, project_summary: "", scope_of_work: [], line_items: [], missing_information: [], recommended_materials: [], assumptions: [], risks: [], requires_site_inspection: false, pricing_status: "requires_database_lookup" },
    partnerId: null,
    userId: u.id,
    customerId: b.customerId ? Number(b.customerId) : null,
  });
  await db.update(quotations).set({ source: "manual" }).where(eq(quotations.id, created.id));
  await audit(u.id, "quotation.create", "quotation", String(created.id));
  return NextResponse.json({ ok: true, id: created.id });
});
