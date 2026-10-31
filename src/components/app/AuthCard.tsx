import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto mb-8 block w-fit" aria-label="HUZA MAJU">
          <Image src="/img/logo.png" alt="HUZA MAJU" width={150} height={50} className="h-12 w-auto" priority />
        </Link>
        <div className="card p-6 md:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {lead && <p className="mt-1 mb-6 text-sm text-mute">{lead}</p>}
          {children}
        </div>
      </div>
    </main>
  );
}
