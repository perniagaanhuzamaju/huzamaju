import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { resourceAction } from "@/lib/admin/resource-api";

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/resources/[resource]/[id]">) => {
  const { resource, id } = await ctx.params;
  return NextResponse.json(await resourceAction(resource, "update", decodeURIComponent(id), await req.json()));
});

export const DELETE = handle(async (_req: Request, ctx: RouteContext<"/api/admin/resources/[resource]/[id]">) => {
  const { resource, id } = await ctx.params;
  return NextResponse.json(await resourceAction(resource, "delete", decodeURIComponent(id), {}));
});
