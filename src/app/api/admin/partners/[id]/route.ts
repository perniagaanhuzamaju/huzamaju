import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partners, users } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { decrypt } from "@/lib/security/crypto";
import { notifyUser, sendEmail } from "@/lib/notify";

const Body = z.object({ action: z.enum(["approve", "suspend", "reject", "reveal"]), note: z.string().max(500).optional() });
const STATUS = { approve: "approved", suspend: "suspended", reject: "rejected" } as const;

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/partners/[id]">) => {
  const b = Body.parse(await req.json());
  const u = await requirePermission(b.action === "reveal" ? "commissions.approve" : "partners.manage");
  const id = Number((await ctx.params).id);
  const [p] = await db.select().from(partners).where(eq(partners.id, id));
  if (!p) throw new HttpError(404, "Tidak dijumpai");
  if (b.action === "reveal") {
    if (!p.payoutAccountEnc) throw new HttpError(404, "Tiada akaun bank");
    await audit(u.id, "partner.bank_reveal", "partner", String(id));
    return NextResponse.json({ ok: true, account: decrypt(p.payoutAccountEnc) });
  }
  const status = STATUS[b.action];
  await db.update(partners).set({ status, notes: b.note ?? p.notes, ...(status === "approved" ? { approvedBy: u.id, approvedAt: new Date() } : {}) }).where(eq(partners.id, id));
  await db.update(users).set({ status: status === "approved" ? "active" : status === "suspended" ? "disabled" : "active" }).where(eq(users.id, p.userId));
  await audit(u.id, `partner.${b.action}`, "partner", String(id));
  const msg = status === "approved" ? "Akaun rakan niaga anda telah diluluskan. Pautan rujukan anda kini aktif." : `Status akaun rakan niaga: ${status}.`;
  await notifyUser(p.userId, "Status rakan niaga HUZA MAJU", msg, "/partner");
  const [usr] = await db.select({ email: users.email }).from(users).where(eq(users.id, p.userId));
  if (usr) await sendEmail(usr.email, "Status rakan niaga HUZA MAJU", `<p>${msg}</p>`);
  return NextResponse.json({ ok: true });
});
