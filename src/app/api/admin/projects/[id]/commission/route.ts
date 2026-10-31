import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { generateCommissionForProject } from "@/lib/commission/service";

export const POST = handle(async (_req: Request, ctx: RouteContext<"/api/admin/projects/[id]/commission">) => {
  const u = await requirePermission("commissions.manage");
  const id = Number((await ctx.params).id);
  const r = await generateCommissionForProject(id);
  await audit(u.id, "commission.generate", "project", String(id), r);
  return NextResponse.json({ ok: true, ...r });
});
