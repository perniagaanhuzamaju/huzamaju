import type { ReactNode } from "react";

const MSG: Record<string, string> = {
  pending: "Permohonan anda sedang disemak. Pautan rujukan dan penghantaran lead akan aktif selepas diluluskan oleh pentadbir.",
  suspended: "Akaun rakan niaga anda digantung. Sila hubungi HUZA MAJU.",
  rejected: "Permohonan rakan niaga anda tidak diluluskan. Sila hubungi HUZA MAJU untuk maklumat lanjut.",
};

export function PartnerStatusNotice({ status }: { status: string }) {
  if (status === "approved") return null;
  return <p className="mb-6 rounded-lg bg-amber/15 p-4 text-sm font-semibold">{MSG[status] ?? status}</p>;
}

export function NoPartner({ children }: { children?: ReactNode }) {
  return <div className="card p-8 text-center text-sm text-mute">Profil rakan niaga tidak dijumpai. {children}</div>;
}
