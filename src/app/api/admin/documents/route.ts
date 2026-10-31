import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/api";
import { currentUser, can, AuthError } from "@/lib/auth/session";
import { storeUpload } from "@/lib/documents";
import { audit } from "@/lib/audit";

/** Staff upload for a customer, project or quotation. */
export const POST = handle(async (req: Request) => {
  const u = await currentUser();
  if (!u || !(can(u, "customers.edit") || can(u, "projects.edit") || can(u, "quotations.edit"))) throw new AuthError(u ? 403 : 401);
  const fd = await req.formData();
  const n = (k: string) => Number(fd.get(k)) || null;
  const link = { customerId: n("customerId"), projectId: n("projectId"), quotationId: n("quotationId") };
  if (!link.customerId && !link.projectId && !link.quotationId) throw new HttpError(400, "Tiada rekod dikaitkan");
  const kind = String(fd.get("kind") ?? "") || undefined;
  const doc = await storeUpload(fd.get("file"), { ...link, kind, uploadedBy: u.id });
  await audit(u.id, "document.upload", "document", String(doc.id), link);
  return NextResponse.json({ id: doc.id });
});
