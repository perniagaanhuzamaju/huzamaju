import Image from "next/image";
import { IconBuilding, IconBroom, IconChip, IconRoad } from "./icons";

const ICONS: Record<string, typeof IconBuilding> = {
  building: IconBuilding, house_renovation: IconBuilding, commercial_renovation: IconBuilding,
  civil: IconRoad, infrastructure: IconRoad, road: IconRoad, drainage: IconRoad,
  facilities: IconBroom, cleaning: IconBroom, ict: IconChip,
};

/**
 * Branded cover for a project that has no finished-work photo yet.
 * It shows only the project's own facts (category, optional title and location), never an invented image.
 */
export function ProjectCover({ title, categoryKey, category, location, className = "" }: { title?: string; categoryKey?: string; category?: string; location?: string | null; className?: string }) {
  const Icon = ICONS[categoryKey ?? ""] ?? IconBuilding;
  return (
    <div className={`pc relative isolate overflow-hidden bg-[#0b0d10] text-white ${className}`}>
      <div className="pc-grid absolute inset-0 -z-10" />
      <div className="absolute top-1/2 left-1/2 -z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/20 blur-3xl transition duration-700 group-hover:bg-amber/30" />
      <div className={`absolute inset-0 grid place-items-center ${title ? "pb-14" : ""}`}>
        <span className="pc-ring relative grid h-24 w-24 place-items-center rounded-full border border-amber/40 bg-white/[0.03] backdrop-blur">
          <span className="absolute inset-[-10px] rounded-full border border-white/10" />
          <span className="absolute inset-[-22px] rounded-full border border-dashed border-white/[0.07]" />
          <Icon width={40} height={40} strokeWidth={1.2} className="text-amber" />
        </span>
      </div>
      <div className="flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-3">
          {category ? <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10.5px] font-bold tracking-[0.12em] text-amber uppercase backdrop-blur">{category}</span> : <span />}
          <Image src="/img/logo.png" alt="" width={44} height={28} className="h-[18px] w-auto opacity-80 invert" />
        </div>
        {title && (
          <div>
            <p className="line-clamp-2 text-[16px] leading-snug font-extrabold tracking-tight">{title}</p>
            {location && <p className="mt-1 line-clamp-1 text-[12.5px] text-white/55">{location}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
