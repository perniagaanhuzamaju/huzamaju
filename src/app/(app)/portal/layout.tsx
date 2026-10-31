import { requirePage } from "@/lib/auth/session";
import { AppShell } from "@/components/app/AppShell";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/portal", label: "Papan pemuka" },
  { href: "/portal/quotations", label: "Sebut harga" },
  { href: "/portal/enquiries", label: "Pertanyaan & lawatan tapak" },
  { href: "/portal/projects", label: "Projek saya" },
  { href: "/portal/documents", label: "Dokumen" },
  { href: "/portal/messages", label: "Komunikasi" },
];

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const u = await requirePage("portal.customer", "/portal");
  return (
    <AppShell title="Portal Pelanggan" user={{ name: u.name, role: u.role }} nav={NAV}>
      {children}
    </AppShell>
  );
}
