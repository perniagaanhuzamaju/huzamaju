import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { websiteContent } from "@/db/schema";
import { handle } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const Body = z.object({ key: z.string().trim().regex(/^[a-z0-9_]{2,100}$/), valueMs: z.string().max(20000).default(""), valueEn: z.string().max(20000).default("") });

export const POST = handle(async (req: Request) => {
  const u = await requirePermission("content.edit");
  const b = Body.parse(await req.json());
  await db.insert(websiteContent).values({ ...b, updatedBy: u.id }).onConflictDoUpdate({ target: websiteContent.key, set: { valueMs: b.valueMs, valueEn: b.valueEn, updatedBy: u.id, updatedAt: new Date() } });
  await audit(u.id, "content.update", "website_content", b.key);
  return NextResponse.json({ ok: true });
});
