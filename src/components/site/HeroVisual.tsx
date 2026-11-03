import type { Lang } from "@/lib/i18n";

/**
 * Hero illustration: an isometric "digital twin" of a building drawn in SVG.
 * It is an illustration, not a photo of a company project, and is labelled as such.
 */

const S = 26; // isometric unit in px
const CX = 300;
const CY = 330;
const C30 = Math.cos(Math.PI / 6);

const iso = (x: number, y: number, z: number) => [CX + (x - y) * C30 * S, CY + (x + y) * 0.5 * S - z * S] as const;
const pt = (x: number, y: number, z: number) => iso(x, y, z).map((n) => n.toFixed(1)).join(",");
const poly = (pts: [number, number, number][]) => pts.map((p) => pt(...p)).join(" ");

type Box = { x: number; y: number; w: number; d: number; h: number; floors: number };

const BOXES: Box[] = [
  { x: -1, y: -3, w: 4, d: 4, h: 9, floors: 9 },
  { x: 3.6, y: -2, w: 3, d: 3, h: 5.5, floors: 5 },
  { x: -1, y: 1.6, w: 5, d: 2.6, h: 3, floors: 3 },
];

function BoxShape({ b, i }: { b: Box; i: number }) {
  const { x, y, w, d, h } = b;
  const top = poly([[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]]);
  const left = poly([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h]]);
  const right = poly([[x + w, y, 0], [x + w, y + d, 0], [x + w, y + d, h], [x + w, y, h]]);
  const floors = Array.from({ length: b.floors - 1 }, (_, f) => ((f + 1) * h) / b.floors);
  const cols = Array.from({ length: Math.max(0, Math.round(w) - 1) }, (_, c) => x + c + 1);
  const rows = Array.from({ length: Math.max(0, Math.round(d) - 1) }, (_, r) => y + r + 1);
  return (
    <g className="hv-rise" style={{ animationDelay: `${0.15 * i}s` }}>
      <polygon points={left} fill="url(#hv-face-l)" stroke="var(--hv-line)" strokeWidth="1" />
      <polygon points={right} fill="url(#hv-face-r)" stroke="var(--hv-line)" strokeWidth="1" />
      <polygon points={top} fill="rgba(242,183,5,0.10)" stroke="var(--hv-gold)" strokeWidth="1.2" />
      {floors.map((z) => (
        <g key={z} stroke="var(--hv-line-soft)" strokeWidth="0.8">
          <polyline fill="none" points={poly([[x, y + d, z], [x + w, y + d, z], [x + w, y, z]])} />
        </g>
      ))}
      {cols.map((cx) => (
        <line key={`c${cx}`} x1={iso(cx, y + d, 0)[0]} y1={iso(cx, y + d, 0)[1]} x2={iso(cx, y + d, h)[0]} y2={iso(cx, y + d, h)[1]} stroke="var(--hv-line-soft)" strokeWidth="0.8" />
      ))}
      {rows.map((ry) => (
        <line key={`r${ry}`} x1={iso(x + w, ry, 0)[0]} y1={iso(x + w, ry, 0)[1]} x2={iso(x + w, ry, h)[0]} y2={iso(x + w, ry, h)[1]} stroke="var(--hv-line-soft)" strokeWidth="0.8" />
      ))}
      {/* corner nodes */}
      {[[x + w, y, h], [x, y, h], [x + w, y + d, h], [x, y + d, h]].map(([a, b2, c], k) => {
        const [px, py] = iso(a, b2, c);
        return <circle key={k} cx={px} cy={py} r="2.4" fill="var(--hv-gold)" />;
      })}
    </g>
  );
}

export function HeroVisual({ lang }: { lang: Lang }) {
  const ms = lang === "ms";
  const grid = Array.from({ length: 15 }, (_, i) => i - 7);
  const [sx, sy] = iso(-1, -3, 9);
  return (
    <div className="hv relative mx-auto aspect-[6/5] w-full max-w-[600px]" aria-hidden="true">
      <svg viewBox="0 0 600 500" className="absolute inset-0 h-full w-full" role="img">
        <defs>
          <linearGradient id="hv-face-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(242,183,5,0.16)" />
            <stop offset="1" stopColor="rgba(242,183,5,0.02)" />
          </linearGradient>
          <linearGradient id="hv-face-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.01)" />
          </linearGradient>
          <radialGradient id="hv-glow" cx="0.5" cy="0.6" r="0.5">
            <stop offset="0" stopColor="rgba(242,183,5,0.28)" />
            <stop offset="1" stopColor="rgba(242,183,5,0)" />
          </radialGradient>
          <linearGradient id="hv-scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(242,183,5,0)" />
            <stop offset="0.5" stopColor="rgba(242,183,5,0.55)" />
            <stop offset="1" stopColor="rgba(242,183,5,0)" />
          </linearGradient>
        </defs>
        <ellipse cx="300" cy="340" rx="290" ry="150" fill="url(#hv-glow)" />
        {/* ground grid */}
        <g stroke="var(--hv-grid)" strokeWidth="0.7">
          {grid.map((g) => (
            <g key={g}>
              <line x1={iso(g, -7, 0)[0]} y1={iso(g, -7, 0)[1]} x2={iso(g, 7, 0)[0]} y2={iso(g, 7, 0)[1]} />
              <line x1={iso(-7, g, 0)[0]} y1={iso(-7, g, 0)[1]} x2={iso(7, g, 0)[0]} y2={iso(7, g, 0)[1]} />
            </g>
          ))}
        </g>
        {/* site boundary */}
        <polygon points={poly([[-3, -5, 0], [8, -5, 0], [8, 6, 0], [-3, 6, 0]])} fill="none" stroke="var(--hv-gold)" strokeWidth="1" strokeDasharray="6 6" opacity="0.6" />
        {BOXES.map((b, i) => (
          <BoxShape key={i} b={b} i={i} />
        ))}
        {/* dimension line on the tower */}
        <g stroke="var(--hv-gold)" strokeWidth="1" opacity="0.85">
          <line x1={iso(-1.8, 1, 0)[0]} y1={iso(-1.8, 1, 0)[1]} x2={iso(-1.8, 1, 9)[0]} y2={iso(-1.8, 1, 9)[1]} />
          <line x1={iso(-2.1, 1, 0)[0]} y1={iso(-2.1, 1, 0)[1]} x2={iso(-1.5, 1, 0)[0]} y2={iso(-1.5, 1, 0)[1]} />
          <line x1={iso(-2.1, 1, 9)[0]} y1={iso(-2.1, 1, 9)[1]} x2={iso(-1.5, 1, 9)[0]} y2={iso(-1.5, 1, 9)[1]} />
        </g>
        {/* scanning beam */}
        <g className="hv-scan">
          <rect x="120" y="0" width="360" height="26" fill="url(#hv-scan)" />
          <line x1="120" y1="13" x2="480" y2="13" stroke="var(--hv-amber)" strokeWidth="1.2" />
        </g>
        <circle cx={sx} cy={sy} r="5" fill="var(--hv-amber)" className="hv-ping" />
      </svg>

      {/* floating data cards (factual labels only) */}
      <div className="hv-card absolute top-[6%] right-[2%]">
        <p className="hv-k">AI Estimator</p>
        <p className="hv-v">{ms ? "Skop → Kuantiti → Harga" : "Scope → Quantity → Price"}</p>
      </div>
      <div className="hv-card absolute bottom-[16%] left-[0%]" style={{ animationDelay: "1.2s" }}>
        <p className="hv-k">CIDB G2</p>
        <p className="hv-v">B · CE · ME</p>
      </div>
      <div className="hv-card absolute right-[4%] bottom-[4%]" style={{ animationDelay: "2.4s" }}>
        <p className="hv-k">{ms ? "Kluang, Johor" : "Kluang, Johor"}</p>
        <p className="hv-v">{ms ? "Bangunan · Sivil · Fasiliti · ICT" : "Building · Civil · Facilities · ICT"}</p>
      </div>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10.5px] font-semibold tracking-wide text-white/40">{ms ? "Ilustrasi" : "Illustration"}</span>
    </div>
  );
}
