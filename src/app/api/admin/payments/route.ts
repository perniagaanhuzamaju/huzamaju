import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { handle } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const Body = z.object({
  projectId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive().max(1e9),
  reference: z.string().trim().max(120).optional().default(""),
  milestone: z.string().trim().max(120).optional().default(""),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(1000).optional().default(""),
});

/** Records a client payment. It counts towards commission only after a second step: verification. */
export const POST = handle(async (req: Request) => {
  const u = await requirePermission("payments.manage");
  const b = Body.parse(await req.json());
  const [p] = await db.insert(payments).values({ ...b, kind: "client_receipt", reference: b.reference || null, milestone: b.milestone || null, notes: b.notes || null }).returning({ id: payments.id });
  await audit(u.id, "payment.record", "payment", String(p.id), b);
  return NextResponse.json({ ok: true, id: p.id });
});
