import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { refreshCommissionEligibility } from "@/lib/commission/service";

/** Verifies a client payment (e.g. after checking the bank statement) and releases eligible commission tranches. */
export const PATCH = handle(async (_req: Request, ctx: RouteContext<"/api/admin/payments/[id]">) => {
  const u = await requirePermission("payments.manage");
  const id = Number((await ctx.params).id);
  const [p] = await db.update(payments).set({ verifiedBy: u.id, verifiedAt: new Date() }).where(and(eq(payments.id, id), isNull(payments.verifiedAt), eq(payments.kind, "client_receipt"))).returning();
  if (!p) throw new HttpError(404, "Bayaran tidak dijumpai atau sudah disahkan");
  const released = p.projectId ? await refreshCommissionEligibility(p.projectId) : 0;
  await audit(u.id, "payment.verify", "payment", String(id), { amount: p.amount, released });
  return NextResponse.json({ ok: true, released });
});
