import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, projects, quotations } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { randomToken } from "@/lib/security/crypto";

const Body = z.union([
  z.object({ fromQuotationId: z.number().int().positive() }),
  z.object({ titleMs: z.string().trim().min(2).max(300), category: z.string().max(40).default("bangunan") }),
]);

const CAT: Record<string, string> = { road_works: "jalan", drainage: "saliran", earthworks: "tanah", civil_works: "sivil", cleaning: "pembersihan", maintenance: "penyelenggaraan", ict: "ict" };

/** Workflow step 5: an accepted quotation becomes a secured project (with its lead, so partner commission can follow). */
export const POST = handle(async (req: Request) => {
  const u = await requirePermission("projects.edit");
  const b = Body.parse(await req.json());
  let values: typeof projects.$inferInsert;
  if ("fromQuotationId" in b) {
    const [q] = await db.select().from(quotations).where(eq(quotations.id, b.fromQuotationId));
    if (!q) throw new HttpError(404, "Sebut harga tidak dijumpai");
    if (q.status !== "accepted") throw new HttpError(400, "Hanya sebut harga yang diterima pelanggan boleh dijadikan projek");
    const [exists] = await db.select({ id: projects.id }).from(projects).where(eq(projects.quotationId, q.id));
    if (exists) return NextResponse.json({ ok: true, id: exists.id });
    values = {
      slug: `${q.number.toLowerCase()}-${randomToken(3).toLowerCase()}`.replace(/[^a-z0-9-]/g, ""),
      titleMs: q.title, titleEn: q.title, category: CAT[q.category] ?? "bangunan", status: "planned", progress: 0,
      location: q.projectLocation, value: q.grandTotal, customerId: q.customerId, quotationId: q.id, leadId: q.leadId, role: "Kontraktor utama",
    };
    if (q.leadId) await db.update(leads).set({ status: "won", updatedAt: new Date() }).where(eq(leads.id, q.leadId));
  } else {
    values = { slug: `projek-${randomToken(4).toLowerCase().replace(/[^a-z0-9]/g, "")}`, titleMs: b.titleMs, titleEn: b.titleMs, category: b.category, status: "planned", progress: 0 };
  }
  const [p] = await db.insert(projects).values(values).returning({ id: projects.id });
  await audit(u.id, "project.create", "project", String(p.id), { fromQuotation: "fromQuotationId" in b ? b.fromQuotationId : null });
  return NextResponse.json({ ok: true, id: p.id });
});
