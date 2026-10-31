import "server-only";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { commissionRules, commissionTransactions, leads, partners, payments, projects } from "@/db/schema";
import { HttpError } from "@/lib/api";
import { notifyUser } from "@/lib/notify";
import { commissionTotal, eligibleTranches, selectRule, tranches, type CommissionRule } from "./engine";
import { klToday } from "@/lib/quotation/number";

/**
 * Workflow step 6: the project is secured (has a contract value) and came from
 * a verified partner lead. Creates commission tranches in "pending" state.
 * Nothing is payable until verified client payments reach each milestone.
 */
export async function generateCommissionForProject(projectId: number) {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p) throw new HttpError(404, "Projek tidak dijumpai");
  if (!p.leadId) throw new HttpError(400, "Projek ini tidak dikaitkan dengan lead");
  if (!p.value || p.value <= 0) throw new HttpError(400, "Nilai kontrak projek belum ditetapkan");
  const [lead] = await db.select().from(leads).where(eq(leads.id, p.leadId));
  if (!lead?.partnerId) throw new HttpError(400, "Lead ini bukan daripada rakan niaga");
  if (["duplicate", "rejected", "lost"].includes(lead.status)) throw new HttpError(400, `Lead berstatus ${lead.status} tidak layak komisen`);
  const [partner] = await db.select().from(partners).where(eq(partners.id, lead.partnerId));
  if (!partner || partner.status !== "approved") throw new HttpError(400, "Rakan niaga tidak aktif");

  const rules = (await db.select().from(commissionRules)) as unknown as CommissionRule[];
  const date = p.startDate ?? klToday();
  const rule = selectRule(rules, { partnerType: partner.type as "referral" | "agent", serviceCategory: lead.serviceCategory, projectValue: p.value, date });
  if (!rule) throw new HttpError(400, "Tiada peraturan komisen aktif yang sepadan. Sila tetapkan peraturan komisen dahulu.");
  const total = commissionTotal(rule, p.value);
  if (total <= 0) throw new HttpError(400, "Peraturan komisen memberi jumlah RM0");
  const parts = tranches(rule, total);
  const inserted = await db
    .insert(commissionTransactions)
    .values(
      parts.map((t) => ({
        partnerId: partner.id,
        leadId: lead.id,
        projectId: p.id,
        ruleId: rule.id,
        trancheNo: t.trancheNo,
        baseValue: p.value!,
        amount: t.amount,
        status: "pending",
        note: `${rule.name} · peringkat ${t.trancheNo}: dibayar apabila ${t.paymentPct}% bayaran pelanggan disahkan`,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: commissionTransactions.id });
  if (lead.status !== "won") await db.update(leads).set({ status: "won", updatedAt: new Date() }).where(eq(leads.id, lead.id));
  if (inserted.length) await notifyUser(partner.userId, "Projek rujukan anda diperoleh", `Komisen RM ${total.toFixed(2)} direkodkan dan akan layak mengikut bayaran pelanggan.`, "/partner/commissions");
  await refreshCommissionEligibility(p.id);
  return { rule: rule.name, total, tranches: parts, created: inserted.length };
}

/** Workflow step 7: marks tranches eligible once verified client payments reach their milestone. */
export async function refreshCommissionEligibility(projectId: number) {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p?.value) return 0;
  const [{ paid }] = await db
    .select({ paid: sql<number>`coalesce(sum(${payments.amount}),0)::float` })
    .from(payments)
    .where(and(eq(payments.projectId, projectId), eq(payments.kind, "client_receipt"), isNotNull(payments.verifiedAt)));
  const txs = await db.select().from(commissionTransactions).where(eq(commissionTransactions.projectId, projectId));
  const byPartner = new Map<number, typeof txs>();
  for (const t of txs) byPartner.set(t.partnerId, [...(byPartner.get(t.partnerId) ?? []), t]);
  let changed = 0;
  for (const [partnerId, list] of byPartner) {
    const rule = list[0].ruleId ? ((await db.select().from(commissionRules).where(eq(commissionRules.id, list[0].ruleId)))[0] as unknown as CommissionRule | undefined) : undefined;
    const ms = [...(rule?.milestones?.length ? rule.milestones : [{ paymentPct: 100, commissionPct: 100 }])].sort((a, b) => a.paymentPct - b.paymentPct);
    const shaped = list.map((t) => ({ trancheNo: t.trancheNo, paymentPct: ms[t.trancheNo - 1]?.paymentPct ?? 100, amount: t.amount }));
    const ok = eligibleTranches(shaped, Number(paid), p.value);
    const ids = list.filter((t) => t.status === "pending" && ok.includes(t.trancheNo)).map((t) => t.id);
    if (ids.length) {
      await db.update(commissionTransactions).set({ status: "eligible", eligibleAt: new Date() }).where(inArray(commissionTransactions.id, ids));
      changed += ids.length;
      const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId));
      if (partner) await notifyUser(partner.userId, "Komisen layak dibayar", `${ids.length} peringkat komisen kini layak dan menunggu kelulusan.`, "/partner/commissions");
    }
  }
  return changed;
}
