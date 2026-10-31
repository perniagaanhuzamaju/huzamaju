import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n";
import { COMPANY } from "@/lib/company";
import { pageMeta } from "@/lib/seo";
import { LegalPage } from "@/components/site/LegalPage";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { lang } = (await params) as { lang: Lang };
  return pageMeta(lang, "/terms", lang === "ms" ? "Terma Perkhidmatan" : "Terms of Service", lang === "ms" ? "Terma penggunaan laman web, anggaran AI dan program rakan niaga HUZA MAJU." : "Terms for the HUZA MAJU website, AI estimates and partner programme.");
}

export default async function Terms({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = (await params) as { lang: Lang };
  const ms = lang === "ms";
  const S: [string, string[]][] = ms
    ? [
        ["1. Penggunaan laman web", [`Laman ${COMPANY.domain} dikendalikan oleh ${COMPANY.name}. Dengan menggunakannya, anda bersetuju dengan terma ini dan Notis Privasi kami.`]],
        ["2. Anggaran AI bukan sebut harga rasmi", ["Setiap anggaran daripada HUZA MAJU AI Estimator ialah \"Anggaran Bajet Awal – Tertakluk kepada Lawatan Tapak dan Pengesahan Akhir\". Harga dikira daripada pangkalan harga syarikat berdasarkan maklumat yang anda berikan, dan boleh berubah selepas ukuran sebenar, pemeriksaan tapak, perubahan harga bahan atau perubahan skop.", "Hanya sebut harga yang telah diluluskan oleh kakitangan yang diberi kuasa dan ditandatangani yang mengikat syarikat."]],
        ["3. Tempoh sah", ["Anggaran sah selama 30 hari dari tarikh dikeluarkan melainkan dinyatakan lain."]],
        ["4. Fail yang dimuat naik", ["Anda mengesahkan anda berhak berkongsi gambar dan lukisan yang dimuat naik. Fail digunakan hanya untuk tujuan anggaran dan projek."]],
        ["5. Program rakan niaga", ["Penyertaan tertakluk kepada kelulusan. Komisen hanya layak apabila projek berjaya diperoleh dan bayaran pelanggan bagi peringkat yang ditetapkan telah disahkan. Penjanaan sebut harga sahaja tidak melayakkan komisen. Kadar, peringkat bayaran dan bonus kempen ditetapkan oleh syarikat dan boleh diubah dari semasa ke semasa. Lead pendua (nombor telefon yang sama dalam 90 hari) dikreditkan kepada lead pertama yang sah.", "Rakan niaga tidak boleh membuat janji harga, jadual atau jaminan bagi pihak syarikat, dan tidak boleh menggunakan nama syarikat secara mengelirukan."]],
        ["6. Had liabiliti", ["Kandungan laman web disediakan untuk maklumat am. Kami berusaha memastikan ia tepat, tetapi tidak bertanggungjawab atas kerugian akibat bergantung pada anggaran awal tanpa sebut harga rasmi."]],
        ["7. Undang-undang", ["Terma ini tertakluk kepada undang-undang Malaysia."]],
      ]
    : [
        ["1. Use of this website", [`${COMPANY.domain} is operated by ${COMPANY.name}. By using it you agree to these terms and our Privacy Notice.`]],
        ["2. AI estimates are not formal quotations", ["Every estimate from the HUZA MAJU AI Estimator is a \"Preliminary Budget Estimate – Subject to Site Inspection and Final Verification\". Prices are calculated from the company's pricing database using the information you provide, and may change after actual measurement, site inspection, material price changes or scope changes.", "Only a quotation approved and signed by authorised company personnel binds the company."]],
        ["3. Validity", ["Estimates are valid for 30 days from issue unless stated otherwise."]],
        ["4. Uploaded files", ["You confirm you have the right to share any photos and drawings you upload. Files are used only for estimating and project purposes."]],
        ["5. Partner programme", ["Participation is subject to approval. Commission is earned only when a project is secured and the client's payment for the relevant milestone has been verified. Generating a quotation alone does not earn commission. Rates, milestones and campaign bonuses are set by the company and may change. Duplicate leads (same phone number within 90 days) are credited to the first valid lead.", "Partners may not make price, schedule or warranty commitments on the company's behalf, or use the company name in a misleading way."]],
        ["6. Limitation of liability", ["Website content is provided for general information. We aim for accuracy but are not liable for losses from relying on a preliminary estimate without a formal quotation."]],
        ["7. Governing law", ["These terms are governed by the laws of Malaysia."]],
      ];
  return <LegalPage lang={lang} eyebrow={ms ? "Terma" : "Terms"} title={ms ? "Terma Perkhidmatan" : "Terms of Service"} updated={ms ? "Kemas kini: 31 Oktober 2026" : "Updated: 31 October 2026"} sections={S} />;
}
