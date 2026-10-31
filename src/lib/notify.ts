import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { env } from "@/lib/env";

type Attachment = { filename: string; content: Buffer };

/** Sends an email through Resend when configured. Returns "sent", "skipped" (not configured) or "failed". */
export async function sendEmail(to: string, subject: string, html: string, attachments: Attachment[] = []) {
  const e = env();
  if (e.EMAIL_PROVIDER !== "resend" || !e.EMAIL_API_KEY) return { status: "skipped" as const, error: "Email provider not configured" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${e.EMAIL_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: e.EMAIL_FROM,
        to: [to],
        subject,
        html,
        attachments: attachments.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
      }),
    });
    if (!r.ok) return { status: "failed" as const, error: `Resend ${r.status}: ${(await r.text()).slice(0, 300)}` };
    return { status: "sent" as const, error: null };
  } catch (err) {
    return { status: "failed" as const, error: String(err) };
  }
}

/** Sends a WhatsApp text through the WhatsApp Business Cloud API when configured. */
export async function sendWhatsApp(toE164Digits: string, text: string) {
  const e = env();
  if (!e.WHATSAPP_API_TOKEN || !e.WHATSAPP_PHONE_NUMBER_ID) return { status: "skipped" as const, error: "WhatsApp API not configured" };
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${e.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${e.WHATSAPP_API_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: toE164Digits, type: "text", text: { body: text.slice(0, 4000) } }),
    });
    if (!r.ok) return { status: "failed" as const, error: `WhatsApp ${r.status}: ${(await r.text()).slice(0, 300)}` };
    return { status: "sent" as const, error: null };
  } catch (err) {
    return { status: "failed" as const, error: String(err) };
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** In-app notification for every staff user, plus email / WhatsApp to the company inbox when configured. */
export async function notifyStaff(title: string, body: string, link?: string) {
  const e = env();
  const staff = await db.select({ id: users.id }).from(users).where(inArray(users.role, ["super_admin", "admin", "staff", "qs"]));
  if (staff.length)
    await db.insert(notifications).values(staff.map((u) => ({ userId: u.id, channel: "in_app", title, body, link: link ?? null, status: "queued" })));
  const url = link ? `${e.APP_URL}${link}` : e.APP_URL;
  if (e.ADMIN_NOTIFY_EMAIL) {
    const r = await sendEmail(e.ADMIN_NOTIFY_EMAIL, `[HUZA MAJU] ${title}`, `<p>${esc(body).replace(/\n/g, "<br>")}</p><p><a href="${url}">${url}</a></p>`);
    await db.insert(notifications).values({ channel: "email", recipient: e.ADMIN_NOTIFY_EMAIL, title, body, link, status: r.status, error: r.error });
  }
  if (e.WHATSAPP_ADMIN_TO) {
    const r = await sendWhatsApp(e.WHATSAPP_ADMIN_TO, `${title}\n${body}\n${url}`);
    await db.insert(notifications).values({ channel: "whatsapp", recipient: e.WHATSAPP_ADMIN_TO, title, body, link, status: r.status, error: r.error });
  }
}

export async function notifyUser(userId: number, title: string, body: string, link?: string) {
  await db.insert(notifications).values({ userId, channel: "in_app", title, body, link: link ?? null });
}
