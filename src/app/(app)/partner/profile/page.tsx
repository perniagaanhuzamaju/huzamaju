import { partnerContext } from "@/lib/data/partner-portal";
import { PageTitle } from "@/components/app/AppShell";
import { NoPartner, PartnerStatusNotice } from "@/components/app/PartnerGate";
import { JsonForm } from "@/components/app/Forms";

export const metadata = { title: "Profil" };

export default async function PartnerProfile() {
  const { user, partner } = await partnerContext();
  if (!partner) return <NoPartner />;
  return (
    <>
      <PageTitle title="Profil & akaun bank" lead={`ID rakan niaga: ${partner.code}`} />
      <PartnerStatusNotice status={partner.status} />
      <div className="card p-6">
        <p className="text-sm"><b>{user.name}</b> · {user.email} · {user.phone}</p>
        <JsonForm action="/api/partner/profile" submit="Simpan" success="Disimpan" className="mt-6 grid gap-4 md:grid-cols-2">
          <div><label className="label" htmlFor="pp-area">Kawasan operasi</label><input id="pp-area" name="area" defaultValue={partner.area ?? ""} maxLength={160} className="field" /></div>
          <div><label className="label" htmlFor="pp-occ">Pekerjaan</label><input id="pp-occ" name="occupation" defaultValue={partner.occupation ?? ""} maxLength={160} className="field" /></div>
          <div><label className="label" htmlFor="pp-bank">Nama bank</label><input id="pp-bank" name="payoutBankName" defaultValue={partner.payoutBankName ?? ""} maxLength={80} className="field" placeholder="cth: Maybank" /></div>
          <div><label className="label" htmlFor="pp-acname">Nama pemegang akaun</label><input id="pp-acname" name="payoutAccountName" defaultValue={partner.payoutAccountName ?? ""} maxLength={160} className="field" /></div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="pp-acno">No. akaun bank</label>
            <input id="pp-acno" name="payoutAccount" inputMode="numeric" maxLength={30} autoComplete="off" className="field" placeholder={partner.payoutAccountLast4 ? `Tersimpan: ****${partner.payoutAccountLast4} (biarkan kosong untuk kekal)` : "Nombor akaun"} />
            <p className="mt-1 text-xs text-mute">Nombor akaun disulitkan (AES-256) dan hanya 4 digit akhir dipaparkan.</p>
          </div>
        </JsonForm>
      </div>
    </>
  );
}
