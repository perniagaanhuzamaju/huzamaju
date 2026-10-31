import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth/session";
import { STAFF_ROLES, type Permission } from "@/lib/auth/permissions";
import { AppShell } from "@/components/app/AppShell";
import { RESOURCES } from "@/lib/admin/resources";

export const dynamic = "force-dynamic";

const NAV: { href: string; label: string; group: string; perm: Permission }[] = [
  { href: "/admin", label: "Papan pemuka", group: "Utama", perm: "customers.view" },
  { href: "/admin/enquiries", label: "Pertanyaan", group: "Pelanggan & jualan", perm: "customers.view" },
  { href: "/admin/leads", label: "Lead", group: "Pelanggan & jualan", perm: "leads.manage" },
  { href: "/admin/customers", label: "Pelanggan", group: "Pelanggan & jualan", perm: "customers.view" },
  { href: "/admin/quotations", label: "Sebut harga", group: "Pelanggan & jualan", perm: "quotations.view" },
  { href: "/admin/projects", label: "Projek & portfolio", group: "Pelanggan & jualan", perm: "projects.view" },
  { href: "/admin/pricing", label: "Pangkalan harga", group: "Harga", perm: "pricing.view" },
  { href: "/admin/pricing/settings", label: "Tetapan harga", group: "Harga", perm: "pricing.edit" },
  ...(["location-adjustments", "minimum-charges", "additional-charges", "materials", "labour", "machinery"] as const).map((k) => ({ href: `/admin/r/${k}`, label: RESOURCES[k].title, group: "Harga", perm: RESOURCES[k].permission })),
  { href: "/admin/partners", label: "Rakan niaga", group: "Rakan niaga", perm: "partners.manage" },
  { href: "/admin/commissions", label: "Komisen", group: "Rakan niaga", perm: "commissions.manage" },
  { href: "/admin/r/commission-rules", label: "Peraturan komisen", group: "Rakan niaga", perm: "commissions.manage" },
  { href: "/admin/payments", label: "Bayaran", group: "Rakan niaga", perm: "payments.manage" },
  { href: "/admin/content", label: "Kandungan laman", group: "Kandungan", perm: "content.edit" },
  ...(["services", "gallery", "blog", "testimonials"] as const).map((k) => ({ href: `/admin/r/${k}`, label: RESOURCES[k].title, group: "Kandungan", perm: RESOURCES[k].permission })),
  { href: "/admin/ai", label: "AI Estimator", group: "Sistem", perm: "ai.manage" },
  { href: "/admin/analytics", label: "Analitik", group: "Sistem", perm: "analytics.view" },
  { href: "/admin/users", label: "Pengguna & peranan", group: "Sistem", perm: "users.manage" },
  { href: "/admin/audit", label: "Log audit", group: "Sistem", perm: "audit.view" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const u = await currentUser();
  if (!u) redirect("/login?next=/admin");
  if (!STAFF_ROLES.includes(u.role)) redirect(homeFor(u));
  const nav = NAV.filter((n) => u.permissions.has(n.perm) || (n.href === "/admin"));
  return (
    <AppShell title="Pentadbir" user={{ name: u.name, role: u.role }} nav={nav}>
      {children}
    </AppShell>
  );
}
