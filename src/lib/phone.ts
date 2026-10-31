/** Normalises Malaysian phone numbers to digits with country code, e.g. 0178717848 -> 60178717848. */
export function normalizePhone(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "60" + d.slice(1);
  if (!d.startsWith("60") && d.length >= 9 && d.length <= 10) d = "60" + d;
  return d;
}

export function isValidMyPhone(raw: string): boolean {
  const d = normalizePhone(raw);
  return /^60\d{8,10}$/.test(d);
}
