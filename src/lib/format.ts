export const rm = (n: number | null | undefined) =>
  n == null ? "-" : `RM ${n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const num = (n: number | null | undefined, d = 3) => (n == null ? "-" : n.toLocaleString("en-MY", { maximumFractionDigits: d }));
export const dmy = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};
export const bytes = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);
