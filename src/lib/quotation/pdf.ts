import "server-only";
import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";
import { COMPANY } from "@/lib/company";
import { UNIT_LABEL, type Unit } from "@/lib/pricing/units";
import type { PublicQuotation } from "./service";

const INK = "#16181b";
const MUTE = "#5d636b";
const LINE = "#e3e1da";
const GOLD = "#a8851a";
const SAND = "#f6f5f1";

const L = {
  ms: {
    prelim: "ANGGARAN BAJET AWAL",
    formal: "SEBUT HARGA",
    no: "No. Rujukan",
    date: "Tarikh",
    valid: "Sah sehingga",
    customer: "Pelanggan",
    location: "Lokasi projek",
    project: "Projek",
    summary: "Ringkasan skop",
    cols: ["No.", "Butiran kerja", "Unit", "Kuantiti", "Kadar (RM)", "Jumlah (RM)"],
    review: "Semakan QS",
    subtotal: "Jumlah kecil",
    contingency: "Peruntukan luar jangka",
    minAdj: "Pelarasan caj minimum",
    sst: "SST",
    total: "JUMLAH ANGGARAN",
    range: "Julat indikatif",
    pending: (n: number) => `${n} item memerlukan semakan QS dan belum dimasukkan dalam jumlah.`,
    assumptions: "Andaian",
    terms: "Terma & syarat",
    sign: "Disediakan oleh sistem HUZA MAJU AI Estimator. Sebut harga rasmi akan dikeluarkan dan ditandatangani oleh wakil syarikat yang diberi kuasa.",
    approved: "Diluluskan oleh wakil syarikat yang diberi kuasa",
    page: "Muka surat",
  },
  en: {
    prelim: "PRELIMINARY BUDGET ESTIMATE",
    formal: "QUOTATION",
    no: "Reference No.",
    date: "Date",
    valid: "Valid until",
    customer: "Customer",
    location: "Project location",
    project: "Project",
    summary: "Scope summary",
    cols: ["No.", "Description of work", "Unit", "Qty", "Rate (RM)", "Amount (RM)"],
    review: "QS review",
    subtotal: "Subtotal",
    contingency: "Contingency allowance",
    minAdj: "Minimum charge adjustment",
    sst: "SST",
    total: "ESTIMATED TOTAL",
    range: "Indicative range",
    pending: (n: number) => `${n} item(s) need QS review and are not included in the total.`,
    assumptions: "Assumptions",
    terms: "Terms & conditions",
    sign: "Prepared by the HUZA MAJU AI Estimator. A formal quotation will be issued and signed by an authorised company representative.",
    approved: "Approved by an authorised company representative",
    page: "Page",
  },
};

const rm = (n: number | null | undefined) =>
  n == null ? "-" : n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const qty = (n: number | null) => (n == null ? "-" : n.toLocaleString("en-MY", { maximumFractionDigits: 3 }));

export async function renderQuotationPdf(v: PublicQuotation, customer?: { name: string; company?: string | null } | null): Promise<Buffer> {
  const t = L[v.lang];
  const doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 56, left: 44, right: 44 }, bufferPages: true, info: { Title: `${v.number} ${v.title}`, Author: COMPANY.name } });
  const fontDir = path.join(process.cwd(), "src/fonts/pdf");
  doc.registerFont("R", path.join(fontDir, "PlusJakartaSans-400.ttf"));
  doc.registerFont("M", path.join(fontDir, "PlusJakartaSans-600.ttf"));
  doc.registerFont("B", path.join(fontDir, "PlusJakartaSans-800.ttf"));
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((res) => doc.on("end", () => res(Buffer.concat(chunks))));

  const W = doc.page.width - 88;
  const X = 44;

  // Header: official logo (unaltered), company details.
  const logo = path.join(process.cwd(), "public/img/logo.png");
  if (fs.existsSync(logo)) doc.image(logo, X, 36, { fit: [150, 52] });
  doc.font("B").fontSize(11).fillColor(INK).text(COMPANY.name, X + 200, 38, { width: W - 200, align: "right" });
  doc
    .font("R")
    .fontSize(7.5)
    .fillColor(MUTE)
    .text(`SSM ${COMPANY.ssm} · CIDB ${COMPANY.cidb} ${COMPANY.cidbGrades}`, { width: W - 200, align: "right" })
    .text(COMPANY.address, { width: W - 200, align: "right" })
    .text(`Tel/WhatsApp ${COMPANY.phoneDisplay} · ${COMPANY.email} · ${COMPANY.domain}`, { width: W - 200, align: "right" });
  doc.moveTo(X, 100).lineTo(X + W, 100).lineWidth(1.2).strokeColor(GOLD).stroke();

  // Title + disclaimer
  doc.font("B").fontSize(16).fillColor(INK).text(v.isFormal ? t.formal : t.prelim, X, 114);
  const discY = doc.y + 6;
  doc.rect(X, discY, W, 24).fillAndStroke(SAND, GOLD);
  doc.font("M").fontSize(9).fillColor(INK).text(v.disclaimer, X + 10, discY + 7.5, { width: W - 20 });

  // Meta grid
  let y = discY + 36;
  const meta: [string, string][] = [
    [t.no, v.number],
    [t.date, fmtDate(v.issueDate)],
    [t.valid, fmtDate(v.validUntil)],
    [t.project, v.title],
  ];
  if (customer) meta.push([t.customer, customer.company ? `${customer.name} (${customer.company})` : customer.name]);
  if (v.location) meta.push([t.location, v.location]);
  for (const [k, val] of meta) {
    doc.font("R").fontSize(8.5).fillColor(MUTE).text(k, X, y, { width: 100 });
    doc.font("M").fontSize(8.5).fillColor(INK).text(val, X + 100, y, { width: W - 100 });
    y = doc.y + 3;
  }

  if (v.summary) {
    y += 6;
    doc.font("B").fontSize(9.5).fillColor(INK).text(t.summary, X, y);
    doc.font("R").fontSize(8.5).fillColor(INK).text(v.summary, X, doc.y + 2, { width: W, lineGap: 1.5 });
    y = doc.y + 10;
  }

  // Items table
  const cols = [26, W - 26 - 64 - 56 - 66 - 78, 64, 56, 66, 78];
  const colX = cols.reduce<number[]>((a, w, i) => [...a, i === 0 ? X : a[i - 1] + cols[i - 1]], []);
  const header = () => {
    doc.rect(X, y, W, 18).fill(INK);
    doc.font("M").fontSize(8).fillColor("#ffffff");
    t.cols.forEach((c, i) => doc.text(c, colX[i] + 4, y + 5, { width: cols[i] - 8, align: i >= 3 ? "right" : "left" }));
    y += 18;
  };
  header();
  v.items.forEach((it, idx) => {
    const unit = UNIT_LABEL[it.unit as Unit]?.[v.lang] ?? it.unit;
    const desc = it.status === "needs_review" && it.reviewReason ? `${it.description}\n(${t.review}: ${it.reviewReason})` : it.description;
    doc.font("R").fontSize(8);
    const h = Math.max(doc.heightOfString(desc, { width: cols[1] - 8 }), doc.heightOfString(unit, { width: cols[2] - 8 }), 10) + 8;
    if (y + h > doc.page.height - 70) {
      doc.addPage();
      y = 44;
      header();
    }
    if (idx % 2 === 1) doc.rect(X, y, W, h).fill(SAND);
    doc.fillColor(INK);
    doc.text(String(idx + 1), colX[0] + 4, y + 4, { width: cols[0] - 8 });
    doc.text(desc, colX[1] + 4, y + 4, { width: cols[1] - 8 });
    doc.text(unit, colX[2] + 4, y + 4, { width: cols[2] - 8 });
    doc.text(qty(it.quantity), colX[3] + 4, y + 4, { width: cols[3] - 8, align: "right" });
    if (it.status === "priced") {
      doc.text(rm(it.rate), colX[4] + 4, y + 4, { width: cols[4] - 8, align: "right" });
      doc.text(rm(it.amount), colX[5] + 4, y + 4, { width: cols[5] - 8, align: "right" });
    } else {
      doc.font("M").fillColor(GOLD).text(t.review, colX[4] + 4, y + 4, { width: cols[4] + cols[5] - 8, align: "right" });
    }
    y += h;
    doc.moveTo(X, y).lineTo(X + W, y).lineWidth(0.5).strokeColor(LINE).stroke();
  });

  // Totals
  const rows: [string, string, boolean?][] = [[t.subtotal, rm(v.subtotal)]];
  for (const a of v.additional) rows.push([a.name, rm(a.amount)]);
  if (v.contingency) rows.push([t.contingency, rm(v.contingency)]);
  if (v.minimumChargeAdjustment) rows.push([t.minAdj, rm(v.minimumChargeAdjustment)]);
  if (v.sst) rows.push([t.sst, rm(v.sst)]);
  rows.push([t.total, `RM ${rm(v.grandTotal)}`, true]);
  if (y + rows.length * 16 + 40 > doc.page.height - 70) {
    doc.addPage();
    y = 44;
  }
  y += 8;
  for (const [k, val, strong] of rows) {
    if (strong) {
      doc.rect(X + W - 250, y - 2, 250, 20).fill(INK);
      doc.font("B").fontSize(9.5).fillColor("#ffffff");
    } else doc.font("R").fontSize(8.5).fillColor(INK);
    doc.text(k, X + W - 244, y + 3, { width: 140 });
    doc.text(val, X + W - 104, y + 3, { width: 98, align: "right" });
    y += strong ? 22 : 15;
  }
  doc.font("R").fontSize(8).fillColor(MUTE);
  if (v.rangeLow != null && v.rangeHigh != null && v.grandTotal > 0)
    doc.text(`${t.range}: RM ${rm(v.rangeLow)} – RM ${rm(v.rangeHigh)}`, X + W - 250, y + 2, { width: 250, align: "right" });
  y = doc.y + 6;
  if (v.pendingReviewCount) doc.font("M").fontSize(8.5).fillColor(GOLD).text(t.pending(v.pendingReviewCount), X, y, { width: W });

  const section = (title: string, lines: string[]) => {
    if (!lines.length) return;
    if (doc.y > doc.page.height - 140) doc.addPage();
    doc.moveDown(0.8).font("B").fontSize(9.5).fillColor(INK).text(title, X, doc.y, { width: W });
    doc.font("R").fontSize(8).fillColor(INK);
    lines.forEach((l, i) => doc.text(`${i + 1}. ${l}`, X, doc.y + 2, { width: W, lineGap: 1 }));
  };
  section(t.assumptions, v.assumptions);
  section(t.terms, v.terms);
  doc.moveDown(1).font("R").fontSize(8).fillColor(MUTE).text(v.isFormal ? t.approved : t.sign, X, doc.y, { width: W });

  // Footer on every page
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const fy = doc.page.height - 40;
    doc.moveTo(X, fy - 6).lineTo(X + W, fy - 6).lineWidth(0.5).strokeColor(LINE).stroke();
    doc.font("R").fontSize(7).fillColor(MUTE);
    doc.text(`${v.number} · ${v.disclaimer}`, X, fy, { width: W - 80, lineBreak: false, height: 10 });
    doc.text(`${t.page} ${i + 1}/${range.count}`, X + W - 80, fy, { width: 80, align: "right", lineBreak: false, height: 10 });
  }
  doc.end();
  return done;
}
