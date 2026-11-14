import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuotationByToken, toPublicView } from "@/lib/quotation/service";
import { QuotationResult } from "@/components/quote/QuotationResult";
import { TopBar } from "@/components/app/TopBar";
import { COMPANY, waLink } from "@/lib/company";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/q/[token]">): Promise<Metadata> {
  const found = await getQuotationByToken((await params).token);
  return { title: found ? found.q.number : "Sebut harga", robots: { index: false, follow: false } };
}

/** Shareable link to an estimate. The unguessable token is the access key, so no cost data is ever included. */
export default async function QuotationLink({ params }: PageProps<"/q/[token]">) {
  const found = await getQuotationByToken((await params).token);
  if (!found) notFound();
  const view = toPublicView(found.q, found.items);
  const ms = view.lang === "ms";
  return (
    <>
      <TopBar home={ms ? "/ms" : "/"}>
        <a href={waLink(`${view.number}`)} target="_blank" rel="noopener" className="btn btn-wa btn-sm">
          WhatsApp {COMPANY.phoneDisplay}
        </a>
      </TopBar>
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <QuotationResult initial={view} showSteps={false} />
        <p className="mt-8 text-center text-sm text-mute">
          <Link href={ms ? "/ms/quotation" : "/quotation"} className="underline">
            {ms ? "Buat anggaran baharu" : "Start a new estimate"}
          </Link>
        </p>
      </main>
    </>
  );
}
