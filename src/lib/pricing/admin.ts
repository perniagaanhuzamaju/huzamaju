import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pricingItemHistory, pricingItems } from "@/db/schema";
import type { Field } from "@/lib/admin/resources";
import { QUOTE_CATEGORIES } from "@/lib/catalog";
import { UNITS } from "./units";

export const PRICING_FIELDS: Field[] = [
  { name: "code", label: "Kod", type: "text", required: true },
  { name: "description", label: "Butiran kerja", type: "text", required: true, wide: true },
  { name: "category", label: "Seksyen / kategori", type: "text", required: true },
  { name: "unit", label: "Unit", type: "select", options: UNITS.map((u) => ({ value: u, label: u })), required: true },
  { name: "materialRate", label: "Bahan (RM/unit)", type: "number" },
  { name: "labourRate", label: "Buruh (RM/unit)", type: "number" },
  { name: "machineryRate", label: "Jentera (RM/unit)", type: "number" },
  { name: "transportRate", label: "Pengangkutan (RM/unit)", type: "number" },
  { name: "subcontractorRate", label: "Subkontraktor (RM/unit)", type: "number" },
  { name: "marketLow", label: "Harga pasaran rendah", type: "number" },
  { name: "marketHigh", label: "Harga pasaran tinggi", type: "number" },
  { name: "effectiveDate", label: "Tarikh berkuat kuasa", type: "date", required: true },
  { name: "supplier", label: "Pembekal", type: "text" },
  { name: "source", label: "Sumber harga", type: "text" },
  { name: "workCategories", label: `Kategori sebut harga (satu baris satu: ${QUOTE_CATEGORIES.map((c) => c.key).join(", ")})`, type: "lines", wide: true },
  { name: "keywords", label: "Kata kunci", type: "text", wide: true },
  { name: "notes", label: "Catatan", type: "textarea", wide: true },
  { name: "isVerified", label: "Kadar disahkan (kos sebenar)", type: "bool" },
  { name: "active", label: "Aktif", type: "bool" },
];

export const COMPONENTS = ["materialRate", "labourRate", "machineryRate", "transportRate", "subcontractorRate"] as const;

export function withTotal<T extends Record<string, unknown>>(data: T, before?: Record<string, unknown>) {
  const v = (k: string) => Number(data[k] ?? before?.[k] ?? 0) || 0;
  return { ...data, totalBaseRate: Math.round(COMPONENTS.reduce((a, k) => a + v(k), 0) * 10000) / 10000 };
}

/** Updates an item and keeps the previous version in pricing_item_history. */
export async function updatePricingItem(id: number, data: Record<string, unknown>, reason: string, userId: number) {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(pricingItems).where(eq(pricingItems.id, id));
    if (!before) return null;
    await tx.insert(pricingItemHistory).values({ pricingItemId: id, snapshot: before as unknown as Record<string, unknown>, reason: reason.slice(0, 200) || null, changedBy: userId });
    await tx.update(pricingItems).set({ ...withTotal(data, before as unknown as Record<string, unknown>), updatedBy: userId, updatedAt: new Date() }).where(eq(pricingItems.id, id));
    return before;
  });
}

export const EXPORT_COLUMNS = ["code", "description", "category", "unit", "materialRate", "labourRate", "machineryRate", "transportRate", "subcontractorRate", "totalBaseRate", "marketLow", "marketHigh", "effectiveDate", "supplier", "source", "workCategories", "keywords", "isVerified", "active", "notes"] as const;
