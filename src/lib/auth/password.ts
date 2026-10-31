import bcrypt from "bcryptjs";

const COST = 12;
export const hashPassword = (plain: string) => bcrypt.hash(plain, COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Minimum 10 characters with at least one letter and one digit. */
export function passwordProblem(p: string): string | null {
  if (p.length < 10) return "Kata laluan mesti sekurang-kurangnya 10 aksara";
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return "Kata laluan mesti ada huruf dan nombor";
  if (p.length > 200) return "Kata laluan terlalu panjang";
  return null;
}
