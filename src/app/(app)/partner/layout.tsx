import { requirePage } from "@/lib/auth/session";
import { AppShell } from "@/components/app/AppShell";

export const dynamic = "force-dynamic";

export default async function PartnerLayout({ children }: LayoutProps<"/partner">) {
  const u = await requirePage("portal.partner", "/partner");
  const nav = [
    { href: "/partner", label: "Papan pemuka" },
    { href: "/partner/leads", label: "Lead & rujukan" },
    { href: "/partner/commissions", label: "Komisen & pendapatan" },
    { href: "/partner/resources", label: u.permissions.has("partner.agent_tools") ? "Bahan jualan" : "Kit perkongsian" },
    { href: "/partner/profile", label: "Profil & akaun bank" },
  ];
  return (
    <AppShell title="Portal Rakan Niaga" user={{ name: u.name, role: u.role }} nav={nav}>
      {children}
    </AppShell>
  );
}
