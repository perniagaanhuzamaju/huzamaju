"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; group?: string };

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const active = (h: string) => path === h || (h.split("/").length > 2 && path.startsWith(`${h}/`));
  return (
    <nav aria-label="Menu" className="md:sticky md:top-24 md:self-start">
      <ul className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
        {items.map((i, idx) => {
          const header = i.group && i.group !== items[idx - 1]?.group ? i.group : null;
          return (
            <li key={i.href} className="shrink-0">
              {header && <p className="mt-4 mb-1 hidden px-3 text-[11px] font-bold tracking-wider text-mute uppercase md:block">{header}</p>}
              <Link href={i.href} className={`block rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap ${active(i.href) ? "bg-ink text-white" : "text-ink-2 hover:bg-white"}`}>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
