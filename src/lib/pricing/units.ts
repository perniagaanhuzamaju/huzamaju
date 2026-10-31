/**
 * Measurement units used in quotations. Conversions are exact factors between
 * units of the same dimension; anything else is not convertible and must be
 * reviewed by a QS.
 */
export const UNITS = [
  "m", "m2", "m3", "ft", "ft2", "ft3", "kg", "tonne",
  "unit", "point", "lot", "day", "hour", "set", "trip",
] as const;
export type Unit = (typeof UNITS)[number];

export const UNIT_LABEL: Record<Unit, { ms: string; en: string }> = {
  m: { ms: "m", en: "m" },
  m2: { ms: "m²", en: "m²" },
  m3: { ms: "m³", en: "m³" },
  ft: { ms: "kaki larian", en: "linear ft" },
  ft2: { ms: "kaki persegi", en: "sq ft" },
  ft3: { ms: "kaki padu", en: "cu ft" },
  kg: { ms: "kg", en: "kg" },
  tonne: { ms: "tan", en: "tonne" },
  unit: { ms: "unit", en: "unit" },
  point: { ms: "titik", en: "point" },
  lot: { ms: "lot", en: "lot" },
  day: { ms: "hari", en: "day" },
  hour: { ms: "jam", en: "hour" },
  set: { ms: "set", en: "set" },
  trip: { ms: "trip", en: "trip" },
};

const ALIASES: Record<string, Unit> = {
  kps: "ft2", sqft: "ft2", "sq ft": "ft2", "ft²": "ft2", "kaki persegi": "ft2",
  ka: "ft", "kaki larian": "ft", lft: "ft", "linear ft": "ft",
  "m²": "m2", sqm: "m2", "m^2": "m2", "m³": "m3", "m^3": "m3", "ft³": "ft3",
  titik: "point", pt: "point", no: "unit", nr: "unit", pcs: "unit", bilik: "unit", room: "unit",
  lokasi: "lot", ls: "lot", "lump sum": "lot", hari: "day", jam: "hour", hr: "hour",
  ton: "tonne", tan: "tonne", t: "tonne",
};

export function normalizeUnit(raw: string | null | undefined): Unit | null {
  if (!raw) return null;
  const u = raw.trim().toLowerCase();
  if ((UNITS as readonly string[]).includes(u)) return u as Unit;
  return ALIASES[u] ?? null;
}

// Factor to the base unit of each dimension.
const DIMENSION: Partial<Record<Unit, { dim: string; toBase: number }>> = {
  m: { dim: "length", toBase: 1 },
  ft: { dim: "length", toBase: 0.3048 },
  m2: { dim: "area", toBase: 1 },
  ft2: { dim: "area", toBase: 0.09290304 },
  m3: { dim: "volume", toBase: 1 },
  ft3: { dim: "volume", toBase: 0.028316846592 },
  kg: { dim: "mass", toBase: 1 },
  tonne: { dim: "mass", toBase: 1000 },
  day: { dim: "time", toBase: 8 }, // one working day = 8 hours
  hour: { dim: "time", toBase: 1 },
};

/** Converts a quantity between units. Returns null when the units are not compatible. */
export function convertQuantity(qty: number, from: Unit, to: Unit): number | null {
  if (from === to) return qty;
  const a = DIMENSION[from];
  const b = DIMENSION[to];
  if (!a || !b || a.dim !== b.dim) return null;
  return (qty * a.toBase) / b.toBase;
}
