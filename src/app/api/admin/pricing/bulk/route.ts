import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pricingItems } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { COMPONENTS, updatePricingItem } from "@/lib/pricing/admin";

const Body = z.object({
  category: z.string().max(80).optional().default(""),
  component: z.enum([...COMPONENTS, "all"]),
  pct: z.coerce.number().min(-50).max(100),
  reason: z.string().trim().min(3).max(200),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Bulk price change, e.g. +5% on material for section D, recorded in history for every item. */
export const POST = handle(async (req: Request) => {
  const u = await requirePermission("pricing.edit");
  const b = Body.parse(await req.json());
  if (b.pct === 0) throw new HttpError(400, "Peratus perubahan tidak boleh 0");
  const items = (await db.select().from(pricingItems)).filter((i) => !b.category || i.category === b.category);
  const comps = b.component === "all" ? COMPONENTS : [b.component];
  for (const it of items) {
    const data: Record<string, unknown> = { effectiveDate: b.effectiveDate };
    for (const c of comps) data[c] = Math.round(Number(it[c]) * (1 + b.pct / 100) * 10000) / 10000;
    await updatePricingItem(it.id, data, `Kemas kini pukal ${b.pct}%: ${b.reason}`, u.id);
  }
  await audit(u.id, "pricing.bulk", "pricing_item", null, { ...b, items: items.length });
  return NextResponse.json({ ok: true, updated: items.length });
});
