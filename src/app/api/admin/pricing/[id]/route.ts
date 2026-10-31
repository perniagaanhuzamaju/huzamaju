import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { coerce } from "@/lib/admin/resources";
import { PRICING_FIELDS, updatePricingItem } from "@/lib/pricing/admin";

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/pricing/[id]">) => {
  const u = await requirePermission("pricing.edit");
  const id = Number((await ctx.params).id);
  const body = (await req.json()) as Record<string, unknown>;
  const { data, errors } = coerce(PRICING_FIELDS, body, true);
  if (errors.length) throw new HttpError(400, errors.join("; "));
  if (data.code) data.code = String(data.code).toUpperCase();
  const before = await updatePricingItem(id, data, String(body.reason ?? ""), u.id);
  if (!before) throw new HttpError(404, "Tidak dijumpai");
  await audit(u.id, "pricing.update", "pricing_item", String(id), { reason: body.reason, after: data });
  return NextResponse.json({ ok: true });
});
