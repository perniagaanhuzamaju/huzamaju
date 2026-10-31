import { desc, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiUsageLogs } from "@/db/schema";
import { requirePage } from "@/lib/auth/session";
import { getAiConfig } from "@/lib/ai/settings";
import { env } from "@/lib/env";
import { PageTitle, Stat } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";

export const metadata = { title: "AI Estimator" };
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5);

export default async function AdminAi() {
  await requirePage("ai.manage", "/admin/ai");
  const cfg = await getAiConfig();
  const e = env();
  const since = daysAgo(30);
  const [byStatus, byDay, logs] = await Promise.all([
    db.select({ status: aiUsageLogs.status, n: sql<number>`count(*)::int`, cost: sql<number>`coalesce(sum(${aiUsageLogs.costUsd}),0)::float`, inT: sql<number>`coalesce(sum(${aiUsageLogs.inputTokens}),0)::int`, outT: sql<number>`coalesce(sum(${aiUsageLogs.outputTokens}),0)::int` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, since)).groupBy(aiUsageLogs.status),
    db.select({ d: sql<string>`to_char(${aiUsageLogs.createdAt} at time zone 'Asia/Kuala_Lumpur','YYYY-MM-DD')`, n: sql<number>`count(*)::int`, cost: sql<number>`coalesce(sum(${aiUsageLogs.costUsd}),0)::float` }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, since)).groupBy(sql`1`).orderBy(sql`1 desc`).limit(14),
    db.select().from(aiUsageLogs).orderBy(desc(aiUsageLogs.createdAt)).limit(100),
  ]);
  const total = byStatus.reduce((a, r) => ({ n: a.n + r.n, cost: a.cost + Number(r.cost), inT: a.inT + r.inT, outT: a.outT + r.outT }), { n: 0, cost: 0, inT: 0, outT: 0 });
  return (
    <>
      <PageTitle title="AI Estimator" lead="Pembekal: Anthropic Claude (Messages API, dipanggil dari pelayan sahaja). Kunci API disimpan dalam pemboleh ubah persekitaran dan tidak boleh dilihat di sini." />
      <p className={`mb-6 rounded-lg p-3 text-sm font-semibold ${e.ANTHROPIC_API_KEY ? "bg-ok/10 text-ok" : "bg-amber/15"}`}>
        {e.ANTHROPIC_API_KEY ? `ANTHROPIC_API_KEY ditetapkan. Model aktif: ${cfg.model}.` : "ANTHROPIC_API_KEY belum ditetapkan. Anggaran AI akan dihantar terus kepada QS untuk semakan manual sehingga kunci ditambah pada pelayan."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Panggilan (30 hari)" value={total.n} />
        <Stat label="Anggaran kos API (30 hari)" value={`USD ${total.cost.toFixed(2)}`} hint={`Kadar: $${e.AI_INPUT_USD_PER_MTOK}/$${e.AI_OUTPUT_USD_PER_MTOK} per juta token`} />
        <Stat label="Token input / output" value={`${(total.inT / 1000).toFixed(1)}k / ${(total.outT / 1000).toFixed(1)}k`} />
        <Stat label="Disekat / gagal" value={byStatus.filter((r) => r.status !== "ok").reduce((a, r) => a + r.n, 0)} hint={byStatus.map((r) => `${r.status}: ${r.n}`).join(" · ")} />
      </div>
      <section className="card mt-8 p-6">
        <h2 className="mb-4 font-bold">Tetapan</h2>
        <JsonForm action="/api/admin/ai" submit="Simpan" success="Disimpan" className="grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm md:col-span-3"><input type="checkbox" name="enabled" defaultChecked={cfg.enabled} /> AI Estimator aktif</label>
          <div><label className="label">Model</label><input name="model" defaultValue={cfg.model} className="field font-mono" /><p className="mt-1 text-xs text-mute">Lalai daripada ANTHROPIC_MODEL ({e.ANTHROPIC_MODEL})</p></div>
          <div><label className="label">Usaha (effort)</label><select name="effort" defaultValue={cfg.effort} className="field">{["low", "medium", "high", "xhigh", "max"].map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><label className="label">Token maksimum</label><input name="max_tokens" type="number" defaultValue={cfg.maxTokens} className="field" /></div>
          <div><label className="label">Had harian (semua pengguna)</label><input name="daily_limit" type="number" defaultValue={cfg.dailyLimit} className="field" /></div>
          <div><label className="label">Had sejam setiap IP</label><input name="per_ip_hourly" type="number" defaultValue={cfg.perIpHourly} className="field" /></div>
          <div><label className="label">Lampiran maksimum dihantar</label><input name="max_attachments" type="number" defaultValue={cfg.maxAttachments} className="field" /></div>
          <label className="flex items-center gap-2 text-sm md:col-span-3"><input type="checkbox" name="send_attachments" defaultChecked={cfg.sendAttachments} /> Hantar gambar/lukisan pelanggan kepada AI (data GPS dibuang dahulu)</label>
          <div className="md:col-span-3"><label className="label">Arahan tambahan QS (dihantar bersama setiap analisis)</label><textarea name="extra_instructions" rows={3} defaultValue={cfg.extraInstructions} className="field" placeholder="cth: Untuk bilik air, sentiasa masukkan kalis air (waterproofing)." /></div>
        </JsonForm>
      </section>
      <h2 className="mt-8 mb-3 font-bold">Penggunaan harian</h2>
      <div className="card overflow-x-auto"><table className="table text-sm"><thead><tr><th>Tarikh</th><th>Panggilan</th><th>Kos (USD)</th></tr></thead><tbody>{byDay.map((d) => <tr key={d.d}><td>{d.d}</td><td>{d.n}</td><td>{Number(d.cost).toFixed(4)}</td></tr>)}</tbody></table></div>
      <h2 className="mt-8 mb-3 font-bold">Log (metadata sahaja, tiada kandungan pelanggan)</h2>
      <div className="card overflow-x-auto">
        <table className="table text-xs">
          <thead><tr><th>Masa</th><th>Tujuan</th><th>Model</th><th>Status</th><th>Input</th><th>Output</th><th>Kos</th><th>Masa (ms)</th><th>Sebut harga</th><th>Ralat</th></tr></thead>
          <tbody>{logs.map((l) => <tr key={l.id}><td>{l.createdAt.toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}</td><td>{l.purpose}</td><td>{l.model}</td><td>{l.status}</td><td>{l.inputTokens}</td><td>{l.outputTokens}</td><td>{l.costUsd.toFixed(4)}</td><td>{l.latencyMs ?? "-"}</td><td>{l.quotationId ?? "-"}</td><td className="max-w-64 truncate">{l.error ?? ""}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
