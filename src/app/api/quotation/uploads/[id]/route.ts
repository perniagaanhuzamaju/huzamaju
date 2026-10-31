import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { projectDocuments } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { deleteObject } from "@/lib/storage";
import { uploadSession } from "@/lib/quotation/uploads";

export const DELETE = handle(async (_req: Request, ctx: RouteContext<"/api/quotation/uploads/[id]">) => {
  const id = Number((await ctx.params).id);
  const sess = await uploadSession(false);
  if (!sess || !Number.isInteger(id)) throw new HttpError(404, "Tidak dijumpai");
  const [doc] = await db
    .delete(projectDocuments)
    .where(and(eq(projectDocuments.id, id), eq(projectDocuments.uploadSession, sess), isNull(projectDocuments.quotationId)))
    .returning();
  if (!doc) throw new HttpError(404, "Tidak dijumpai");
  await deleteObject(doc.storageKey).catch(() => {});
  return NextResponse.json({ ok: true });
});
