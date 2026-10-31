import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { resourceAction } from "@/lib/admin/resource-api";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/admin/resources/[resource]">) => {
  const { resource } = await ctx.params;
  return NextResponse.json(await resourceAction(resource, "create", null, await req.json()));
});
