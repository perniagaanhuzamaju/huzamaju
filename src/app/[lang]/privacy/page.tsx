import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import { COMPANY } from "@/lib/company";
import { pageMeta } from "@/lib/seo";
import { LegalPage } from "@/components/site/LegalPage";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(lang, "/privacy", lang === "ms" ? "Notis Privasi (PDPA)" : "Privacy Notice (PDPA)", lang === "ms" ? "Bagaimana HUZA MAJU mengumpul, menggunakan dan melindungi data peribadi anda." : "How HUZA MAJU collects, uses and protects your personal data.");
}

export default async function Privacy({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = (await params) as { lang: Lang };
  const ms = lang === "ms";
  const S: [string, string[]][] = ms
    ? [
        ["1. Siapa kami", [`Notis ini dikeluarkan oleh ${COMPANY.name} (SSM ${COMPANY.ssm}), ${COMPANY.address}, mengikut Akta Perlindungan Data Peribadi 2010 (PDPA).`]],
        ["2. Data yang kami kumpul", ["• Maklumat hubungan: nama, nama syarikat, nombor telefon, e-mel dan alamat projek.", "• Maklumat projek: penerangan kerja, ukuran, gambar, lukisan dan lokasi tapak.", "• Maklumat akaun: e-mel log masuk dan kata laluan (disimpan dalam bentuk hash, tidak boleh dibaca).", "• Maklumat rakan niaga: kawasan, pekerjaan, dan butiran bank untuk bayaran komisen (disulitkan).", "• Data teknikal: log keselamatan dengan alamat IP yang di-hash, dan kuki sesi."]],
        ["3. Tujuan", ["Kami menggunakan data anda untuk menjawab pertanyaan, menyediakan anggaran dan sebut harga, mengatur lawatan tapak, melaksanakan projek, mengurus program rakan niaga dan bayaran komisen, mematuhi undang-undang, dan menjaga keselamatan laman web."]],
        ["4. AI dan pemprosesan pihak ketiga", ["HUZA MAJU AI Estimator menggunakan Anthropic Claude API untuk menganalisis penerangan projek. Kami hanya menghantar maklumat teknikal projek (kategori, ukuran, spesifikasi, gambar tapak yang anda muat naik) dan tidak menghantar nama, nombor telefon, e-mel atau alamat penuh anda kepada penyedia AI. Pemprosesan ini mungkin berlaku di luar Malaysia.", "Kami juga menggunakan penyedia hosting, storan awan, e-mel dan WhatsApp untuk menjalankan perkhidmatan. Mereka hanya memproses data mengikut arahan kami."]],
        ["5. Pendedahan", ["Kami tidak menjual data peribadi. Data hanya didedahkan kepada kakitangan yang berkaitan, subkontraktor yang terlibat dalam projek anda, penyedia perkhidmatan di atas, dan pihak berkuasa jika dikehendaki undang-undang. Jika anda dirujuk oleh rakan niaga, rakan tersebut hanya melihat status lead dan projek, bukan dokumen anda."]],
        ["6. Tempoh simpanan", ["• Pertanyaan dan lead yang tidak menjadi projek: dipadam atau dianonimkan selepas 24 bulan.", "• Rekod projek, sebut harga dan invois: disimpan 7 tahun untuk tujuan perakaunan dan cukai.", "• Log AI: hanya metadata (token, kos, status) disimpan; kandungan penuh tidak disimpan dalam log.", "• Fail muat naik yang tidak dikaitkan dengan sebut harga: dipadam selepas 30 hari."]],
        ["7. Keselamatan", ["Sambungan HTTPS, kata laluan di-hash, kawalan akses berasaskan peranan, penyulitan butiran bank, had kadar permintaan, log audit dan sandaran pangkalan data berkala."]],
        ["8. Hak anda", ["Anda boleh meminta akses, pembetulan atau pemadaman data anda, menarik balik persetujuan, atau menghadkan pemprosesan untuk pemasaran, dengan menghubungi kami. Kami akan menjawab dalam tempoh 21 hari."]],
        ["9. Kuki", ["Kami menggunakan kuki yang perlu untuk log masuk dan penjejakan rujukan rakan niaga (30 hari). Jika Google Analytics diaktifkan, kuki analitik digunakan dengan IP dianonimkan."]],
        ["10. Hubungi", [`Pertanyaan privasi: ${COMPANY.email} atau ${COMPANY.phoneDisplay}.`]],
      ]
    : [
        ["1. Who we are", [`This notice is issued by ${COMPANY.name} (SSM ${COMPANY.ssm}), ${COMPANY.address}, under Malaysia's Personal Data Protection Act 2010 (PDPA).`]],
        ["2. Data we collect", ["• Contact details: name, company name, phone, email and project address.", "• Project details: work description, measurements, photos, drawings and site location.", "• Account details: login email and password (stored as a one-way hash).", "• Partner details: area, occupation and bank details for commission payments (encrypted).", "• Technical data: security logs with hashed IP addresses, and session cookies."]],
        ["3. Purpose", ["We use your data to answer enquiries, prepare estimates and quotations, arrange site visits, carry out projects, run the partner programme and commission payments, comply with the law and keep the website secure."]],
        ["4. AI and third-party processing", ["The HUZA MAJU AI Estimator uses the Anthropic Claude API to analyse project descriptions. We send only technical project information (category, measurements, specifications and site photos you upload) and never your name, phone number, email or full address. This processing may take place outside Malaysia.", "We also use hosting, cloud storage, email and WhatsApp providers to operate the service. They process data only on our instructions."]],
        ["5. Disclosure", ["We do not sell personal data. Data is disclosed only to relevant staff, subcontractors working on your project, the providers above, and authorities where required by law. If you were referred by a partner, the partner sees only lead and project status, not your documents."]],
        ["6. Retention", ["• Enquiries and leads that do not become projects: deleted or anonymised after 24 months.", "• Project records, quotations and invoices: kept 7 years for accounting and tax.", "• AI logs: only metadata (tokens, cost, status) is stored, not full content.", "• Uploads not linked to a quotation: deleted after 30 days."]],
        ["7. Security", ["HTTPS, hashed passwords, role-based access control, encrypted bank details, rate limiting, audit logs and regular database backups."]],
        ["8. Your rights", ["You may request access to, correction or deletion of your data, withdraw consent, or limit marketing use by contacting us. We respond within 21 days."]],
        ["9. Cookies", ["We use essential cookies for login and partner referral tracking (30 days). If Google Analytics is enabled, analytics cookies are used with anonymised IPs."]],
        ["10. Contact", [`Privacy enquiries: ${COMPANY.email} or ${COMPANY.phoneDisplay}.`]],
      ];
  return <LegalPage lang={lang} eyebrow="PDPA 2010" title={ms ? "Notis Privasi" : "Privacy Notice"} updated={ms ? "Kemas kini: 31 Oktober 2026" : "Updated: 31 October 2026"} sections={S} />;
}
