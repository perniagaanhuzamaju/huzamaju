import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function TopBar({ children, home = "/" }: { children?: ReactNode; home?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href={home} className="flex items-center gap-3" aria-label="HUZA MAJU">
          <Image src="/img/logo.png" alt="HUZA MAJU" width={120} height={40} className="h-9 w-auto" priority />
        </Link>
        <div className="flex items-center gap-2 text-sm">{children}</div>
      </div>
    </header>
  );
}
