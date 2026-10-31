import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { handle, HttpError } from "@/lib/api";
import { portalApiContext } from "@/lib/data/portal";
import { storeUpload } from "@/lib/documents";
import { rateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { notifyStaff } from "@/lib/notify";

export const POST = handle(async (req: Request) => {
  const { user, customerId } = await portalApiContext();
  if (!(await rateLimit(`portal-up:${user.id}`, 30, 3600)).allowed) throw new RateLimitError();
  const fd = await req.formData();
  const projectId = Number(fd.get("projectId")) || null;
  if (projectId) {
    const [p] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), eq(projects.customerId, customerId)));
    if (!p) throw new HttpError(404, "Projek tidak dijumpai");
  }
  const doc = await storeUpload(fd.get("file"), { customerId, projectId, uploadedBy: user.id });
  await notifyStaff("Dokumen baharu dari pelanggan", `${user.name} memuat naik ${doc.fileName}`, `/admin/customers/${customerId}`);
  return NextResponse.json({ id: doc.id });
});
