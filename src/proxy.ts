import { NextResponse, type NextRequest } from "next/server";

/**
 * Locale routing: Bahasa Melayu is served at the root, English under /en.
 * Internally every public page lives under app/[lang]/, so "/services" is
 * rewritten to "/ms/services". App areas (admin, portals, API) are untouched.
 * A "?ref=CODE" on any public URL is handed to /r/CODE for referral attribution.
 */
const APP_PREFIXES = ["/api", "/admin", "/portal", "/partner", "/login", "/register", "/logout", "/r", "/q", "/_next", "/img", "/robots.txt", "/sitemap.xml"];

export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  if (APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (/\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();

  const ref = searchParams.get("ref");
  if (ref && /^[A-Z0-9-]{4,20}$/i.test(ref)) {
    const to = new URL(`/r/${encodeURIComponent(ref.toUpperCase())}`, req.url);
    const clean = req.nextUrl.clone();
    clean.searchParams.delete("ref");
    to.searchParams.set("to", clean.pathname + clean.search);
    return NextResponse.redirect(to);
  }

  if (pathname === "/ms" || pathname.startsWith("/ms/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/ms${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
