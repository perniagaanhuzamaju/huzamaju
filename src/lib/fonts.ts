import localFont from "next/font/local";

export const jakarta = localFont({
  variable: "--font-jakarta",
  display: "swap",
  src: [
    { path: "../fonts/plus-jakarta-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/plus-jakarta-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/plus-jakarta-sans-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/plus-jakarta-sans-latin-700-normal.woff2", weight: "700" },
    { path: "../fonts/plus-jakarta-sans-latin-800-normal.woff2", weight: "800" },
  ],
});
