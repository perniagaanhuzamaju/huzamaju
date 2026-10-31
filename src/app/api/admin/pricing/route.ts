import { NextResponse } from "next/server";
import { db } from "@/db";
import { pricingItems } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { coerce } from "@/lib/admin/resources";
import { PRICING_FIELDS, withTotal } from "@/lib/pricing/admin";

export const POST = handle(async (req: Request) => {
  const u = await requirePermission("pricing.edit");
  const { data, errors } = coerce(PRICING_FIELDS, await req.json(), false);
  if (errors.length) throw new HttpError(400, errors.join("; "));
  data.code = String(data.code).toUpperCase();
  try {
    const [row] = await db.insert(pricingItems).values({ ...withTotal(data), updatedBy: u.id } as typeof pricingItems.$inferInsert).returning({ id: pricingItems.id });
    await audit(u.id, "pricing.create", "pricing_item", String(row.id), data);
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    if ((e as { cause?: { code?: string } }).cause?.code === "23505") throw new HttpError(409, "Kod sudah wujud");
    throw e;
  }
});
