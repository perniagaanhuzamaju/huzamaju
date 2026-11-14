/** Verified company facts (from SSM, CIDB, JCCD, MOF and LHDN documents, checked 23/10/2026). */
export const COMPANY = {
  name: "PERNIAGAAN HUZA MAJU",
  shortName: "HUZA MAJU",
  tagline: { ms: "Membina Penyelesaian. Mencipta Peluang.", en: "Building Solutions. Creating Opportunities." },
  positioning: {
    ms: "Rakan dipercayai anda dalam pembinaan, infrastruktur & penyelesaian bersepadu.",
    en: "Your Trusted Partner in Construction, Infrastructure & Integrated Solutions.",
  },
  ssm: "201803002916 (JM0840444-M)",
  cidb: "0120181127-JH020071",
  cidbGrades: "B, CE, ME",
  jccd: "JCCD/SKJ/20/02/02390",
  mof: "357-0002367958",
  founded: "2018-01-03",
  owner: "Syed Hud bin Syed Abdullah",
  phoneDisplay: "017-871 7848",
  phoneIntl: "+60178717848",
  whatsapp: "60178717848",
  email: "huzamaju@gmail.com",
  address: "No. 12A, Jalan Penaga 1, Kampung Dato Abdul Rahman Yassin, 86000 Kluang, Johor",
  city: "Kluang",
  state: "Johor",
  postcode: "86000",
  domain: "huzamaju.my",
  /** Google Business Profile (Google Maps) listing. */
  googleMaps: "https://maps.app.goo.gl/6KFRykGNV5T2Enxt8",
  facebook: "https://www.facebook.com/HUZAMAJU",
  /** The company is not registered for SST (see dokumen/surat/Surat_Tidak_Berdaftar_SST). */
  sstRegistered: false,
} as const;

export const waLink = (text?: string) =>
  `https://wa.me/${COMPANY.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
