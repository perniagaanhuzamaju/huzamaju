/** Permission catalogue and default role grants. Seeded into roles / permissions / role_permissions. */
export const PERMISSIONS = {
  "customers.view": "Lihat pelanggan, pertanyaan & sejarah komunikasi",
  "customers.edit": "Ubah rekod pelanggan & log komunikasi",
  "leads.manage": "Sahkan, tolak & kemas kini status lead",
  "quotations.view": "Lihat sebut harga",
  "quotations.edit": "Cipta & ubah sebut harga",
  "quotations.approve": "Luluskan sebut harga rasmi",
  "pricing.view": "Lihat pangkalan harga dalaman",
  "pricing.edit": "Ubah, import & kemas kini pukal harga",
  "projects.view": "Lihat projek",
  "projects.edit": "Cipta & ubah projek",
  "partners.manage": "Luluskan rakan niaga & urus lead mereka",
  "commissions.manage": "Urus peraturan komisen & jana komisen",
  "commissions.approve": "Luluskan pembayaran komisen",
  "payments.manage": "Rekod & sahkan bayaran",
  "content.edit": "Urus kandungan laman web",
  "ai.manage": "Konfigurasi AI, had & log",
  "analytics.view": "Lihat analitik perniagaan",
  "users.manage": "Urus pengguna & peranan",
  "audit.view": "Lihat log audit",
  "portal.customer": "Akses portal pelanggan",
  "portal.partner": "Akses portal rakan niaga",
  "partner.agent_tools": "Alat ejen jualan (urus pelanggan & bahan pemasaran)",
} as const;

export type Permission = keyof typeof PERMISSIONS;
export type RoleKey = "super_admin" | "admin" | "staff" | "qs" | "sales_agent" | "referral_partner" | "customer";

const ALL = Object.keys(PERMISSIONS) as Permission[];
const STAFF_AREA = ALL.filter((p) => !p.startsWith("portal.") && p !== "partner.agent_tools");

export const ROLES: Record<RoleKey, { name: string; description: string; permissions: Permission[] }> = {
  super_admin: { name: "Super Admin", description: "Akses penuh termasuk pengguna & peranan", permissions: STAFF_AREA },
  admin: { name: "Admin", description: "Urus operasi harian kecuali pengguna", permissions: STAFF_AREA.filter((p) => p !== "users.manage") },
  staff: {
    name: "Staf",
    description: "Pertanyaan, lead, pelanggan, projek & kandungan",
    permissions: ["customers.view", "customers.edit", "leads.manage", "quotations.view", "projects.view", "projects.edit", "content.edit"],
  },
  qs: {
    name: "QS / Estimator",
    description: "Pangkalan harga, sebut harga & kelulusan",
    permissions: ["customers.view", "quotations.view", "quotations.edit", "quotations.approve", "pricing.view", "pricing.edit", "projects.view", "analytics.view"],
  },
  sales_agent: { name: "Ejen Jualan", description: "Portal rakan niaga dengan alat jualan", permissions: ["portal.partner", "partner.agent_tools"] },
  referral_partner: { name: "Rakan Rujukan", description: "Portal rakan niaga", permissions: ["portal.partner"] },
  customer: { name: "Pelanggan", description: "Portal pelanggan", permissions: ["portal.customer"] },
};

export const STAFF_ROLES: RoleKey[] = ["super_admin", "admin", "staff", "qs"];
