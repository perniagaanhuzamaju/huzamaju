import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projectDocuments } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { currentUser, AuthError } from "@/lib/auth/session";
import { canAccessDocument } from "@/lib/documents";
import { getObject } from "@/lib/storage";

/** Streams a private document after a permission check. Never cached publicly. */
export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/documents/[id]">) => {
  const u = await currentUser();
  if (!u) throw new AuthError(401);
  const id = Number((await ctx.params).id);
  const [doc] = Number.isInteger(id) ? await db.select().from(projectDocuments).where(eq(projectDocuments.id, id)) : [];
  if (!doc || !(await canAccessDocument(u, doc))) throw new HttpError(404, "Tidak dijumpai");
  const data = await getObject(doc.storageKey);
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": doc.mimeType,
      "content-disposition": `inline; filename="${doc.fileName.replace(/"/g, "")}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
});
