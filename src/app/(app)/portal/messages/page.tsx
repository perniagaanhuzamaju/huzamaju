import { portalContext, customerMessages } from "@/lib/data/portal";
import { PageTitle, Empty } from "@/components/app/AppShell";
import { JsonForm } from "@/components/app/Forms";

export const metadata = { title: "Komunikasi" };

const CH: Record<string, string> = { note: "Nota", phone: "Telefon", whatsapp: "WhatsApp", email: "E-mel", portal: "Portal", site_visit: "Lawatan tapak" };

export default async function PortalMessages() {
  const { customerId } = await portalContext();
  const ms = await customerMessages(customerId);
  return (
    <>
      <PageTitle title="Komunikasi" lead="Sejarah komunikasi anda dengan HUZA MAJU." />
      <div className="card mb-6 p-5">
        <JsonForm action="/api/portal/messages" submit="Hantar mesej" reset className="grid gap-3">
          <textarea name="body" required minLength={2} maxLength={3000} rows={3} className="field" placeholder="Tulis mesej kepada pasukan HUZA MAJU" />
        </JsonForm>
      </div>
      {ms.length ? (
        <ul className="grid gap-3">
          {ms.map((m) => (
            <li key={m.id} className={`card p-4 ${m.direction === "in" ? "md:ml-16" : "md:mr-16 bg-sand"}`}>
              <p className="text-xs font-semibold text-mute">
                {m.direction === "in" ? "Anda" : "HUZA MAJU"} · {CH[m.channel] ?? m.channel} · {m.createdAt.toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}
              </p>
              <p className="mt-1 text-sm whitespace-pre-line">{m.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Tiada mesej lagi.</Empty>
      )}
    </>
  );
}
