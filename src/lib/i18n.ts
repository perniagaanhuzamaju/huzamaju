import type { Lang } from "./catalog";

export type { Lang };
export const LANGS: Lang[] = ["ms", "en"];
export const isLang = (x: string): x is Lang => x === "ms" || x === "en";

/** Builds a localised path: Malay lives at the root, English under /en. */
export const href = (lang: Lang, path = "/") => {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (lang === "ms") return p;
  return p === "/" ? "/en" : `/en${p}`;
};

const ms = {
  nav: {
    home: "Utama",
    about: "Tentang Kami",
    services: "Perkhidmatan",
    projects: "Projek",
    capabilities: "Keupayaan",
    quotation: "Sebut Harga AI",
    partners: "Rakan Niaga",
    contact: "Hubungi",
  },
  cta: {
    requestQuote: "Minta Sebut Harga",
    instantEstimate: "Anggaran Segera",
    becomePartner: "Jadi Rakan Niaga",
    contact: "Hubungi Kami",
    explore: "Terokai Perkhidmatan",
    getInstant: "Dapatkan Sebut Harga Segera",
    whatsapp: "WhatsApp kami",
    viewAll: "Lihat semua",
    readMore: "Ketahui lanjut",
    login: "Log masuk",
  },
  hero: {
    eyebrow: "Kontraktor Binaan, Sivil & Penyelesaian Bersepadu · Kluang, Johor",
    title: "Membina Penyelesaian. Mencipta Peluang.",
    text: "Satu kontraktor untuk bangunan, jalan dan saliran, penyelenggaraan fasiliti serta ICT. Berdaftar dengan CIDB dan beroperasi dari Kluang sejak 2018, kami mengurus projek anda dari sebut harga hingga serah kunci, dengan kos yang telus dan laporan progres yang jelas.",
  },
  home: {
    introEyebrow: "Pengenalan Syarikat",
    introTitle: "Kontraktor tempatan, standard kerja profesional.",
    capEyebrow: "Keupayaan Syarikat",
    capTitle: "Dibuktikan di tapak, bukan di atas kertas.",
    servicesEyebrow: "Perkhidmatan Teras",
    servicesTitle: "Lima bidang kepakaran. Satu kontraktor yang bertanggungjawab.",
    industriesEyebrow: "Sektor Yang Kami Layani",
    industriesTitle: "Dari pemilik rumah hingga agensi kerajaan.",
    whyEyebrow: "Kenapa HUZA MAJU",
    whyTitle: "Kerja yang siap dengan amanah.",
    projectsEyebrow: "Projek Pilihan",
    projectsTitle: "Rekod kerja sebenar, gambar dari tapak kami.",
    aiEyebrow: "Sebut Harga AI",
    aiTitle: "Anggaran bajet awal dalam beberapa minit.",
    aiText:
      "HUZA MAJU AI Estimator membantu memecahkan skop kerja anda kepada item, unit dan kuantiti. Semua harga dikira oleh sistem daripada pangkalan harga syarikat, bukan direka oleh AI. Setiap anggaran disemak oleh QS kami sebelum menjadi sebut harga rasmi.",
    partnerEyebrow: "Program Rakan Niaga",
    partnerTitle: "Hubungkan Peluang. Raih Bersama.",
    partnerText:
      "Kenal seseorang yang mahu bina atau renovate? Sertai program Rakan Rujukan atau Ejen Jualan Bebas dan terima komisen apabila projek berjaya dan bayaran pelanggan disahkan.",
    enquiryEyebrow: "Pertanyaan Korporat",
    enquiryTitle: "Ada projek, tender atau kerja subkontrak?",
    enquiryText: "Hantar butiran ringkas. Pasukan kami akan menghubungi anda dalam masa satu hari bekerja.",
  },
  labels: {
    actualPhoto: "Gambar projek sebenar HUZA MAJU",
    illustrativePhoto: "Gambar ilustrasi",
    stockNote: "Gambar projek sebenar dilabel di laman. Gambar lain di laman ini ialah gambar stok untuk hiasan.",
    scope: "Skop kerja",
    client: "Pelanggan",
    location: "Lokasi",
    role: "Peranan",
    status: "Status",
    value: "Nilai projek",
    duration: "Tempoh",
    all: "Semua",
    phone: "Telefon / WhatsApp",
    email: "E-mel",
    address: "Alamat",
    name: "Nama penuh",
    company: "Nama syarikat",
    message: "Mesej",
    service: "Perkhidmatan",
    send: "Hantar",
    sending: "Menghantar…",
    sent: "Terima kasih. Pertanyaan anda telah diterima.",
    consent: "Saya bersetuju data saya diproses mengikut Notis Privasi untuk tujuan pertanyaan ini.",
    privacy: "Notis Privasi",
    terms: "Terma Perkhidmatan",
    registered: "Pendaftaran",
    language: "English",
  },
};

type Dict = typeof ms;

const en: Dict = {
  nav: {
    home: "Home",
    about: "About Us",
    services: "Our Services",
    projects: "Our Projects",
    capabilities: "Our Capabilities",
    quotation: "AI Instant Quotation",
    partners: "Business Partnership",
    contact: "Contact Us",
  },
  cta: {
    requestQuote: "Request a Quotation",
    instantEstimate: "Get Instant Estimate",
    becomePartner: "Become a Business Partner",
    contact: "Contact Us",
    explore: "Explore Our Services",
    getInstant: "Get Instant Quotation",
    whatsapp: "WhatsApp us",
    viewAll: "View all",
    readMore: "Learn more",
    login: "Log in",
  },
  hero: {
    eyebrow: "Construction, Civil & Integrated Solutions · Kluang, Johor",
    title: "Building Solutions. Creating Opportunities.",
    text: "One contractor for buildings, roads and drainage, facilities maintenance and ICT. CIDB registered and operating from Kluang since 2018, we manage your project from quotation to handover, with transparent costs and clear progress reports.",
  },
  home: {
    introEyebrow: "Company Introduction",
    introTitle: "A local contractor with professional standards.",
    capEyebrow: "Company Capabilities",
    capTitle: "Proven on site, not on paper.",
    servicesEyebrow: "Core Services",
    servicesTitle: "Five areas of expertise. One accountable contractor.",
    industriesEyebrow: "Industries Served",
    industriesTitle: "From homeowners to government agencies.",
    whyEyebrow: "Why Choose Huza Maju",
    whyTitle: "Work delivered with integrity.",
    projectsEyebrow: "Featured Projects",
    projectsTitle: "Real work, photographed on our own sites.",
    aiEyebrow: "AI Quotation",
    aiTitle: "A preliminary budget in minutes.",
    aiText:
      "The HUZA MAJU AI Estimator breaks your scope down into work items, units and quantities. Every price is calculated by our system from the company's approved pricing database, never invented by AI. Each estimate is reviewed by our QS before it becomes a formal quotation.",
    partnerEyebrow: "Business Partner Programme",
    partnerTitle: "Connect Opportunities. Earn Together.",
    partnerText:
      "Know someone who wants to build or renovate? Join as a Referral Partner or Freelance Sales Agent and earn commission when the project is secured and the client's payment is verified.",
    enquiryEyebrow: "Corporate Enquiry",
    enquiryTitle: "Have a project, tender or subcontract?",
    enquiryText: "Send us the details. Our team will get back to you within one working day.",
  },
  labels: {
    actualPhoto: "Actual HUZA MAJU project photo",
    illustrativePhoto: "Illustrative photo",
    stockNote: "Actual project photos are labelled on the site. Other images on this site are stock photos used for illustration.",
    scope: "Scope of work",
    client: "Client",
    location: "Location",
    role: "Role",
    status: "Status",
    value: "Project value",
    duration: "Duration",
    all: "All",
    phone: "Phone / WhatsApp",
    email: "Email",
    address: "Address",
    name: "Full name",
    company: "Company name",
    message: "Message",
    service: "Service",
    send: "Send",
    sending: "Sending…",
    sent: "Thank you. Your enquiry has been received.",
    consent: "I agree that my data will be processed under the Privacy Notice for this enquiry.",
    privacy: "Privacy Notice",
    terms: "Terms of Service",
    registered: "Registration",
    language: "Bahasa Melayu",
  },
};

export const DICT: Record<Lang, Dict> = { ms, en };
export const t = (lang: Lang) => DICT[lang];
export const pick = <T extends { ms: string; en: string }>(o: T, lang: Lang) => o[lang];
