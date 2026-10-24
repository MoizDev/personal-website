/**
 * Faint line drawings behind each project card, in the style of a drafting
 * sheet: rulers, arcs, crosshairs, dimension arrows and dashed guides, each
 * card with a motif from its project.
 *
 * Every drawing is on a 100 x 100 sheet (the card), with strokes a fixed
 * pixel width whatever the card's size. The card name sits in the bottom left
 * and the screenshot or logo in the middle, so the drawings live mostly along
 * the edges and in the bottom right.
 *
 * To add a card: write a drawing here with the kit below and give it to the
 * project's `lines` in lib/projects.ts.
 */

import type { ReactNode } from "react";

export type LineArt = () => ReactNode;

type Pt = [number, number];

/** Round to keep the markup short. */
const r = (n: number) => Math.round(n * 100) / 100;

/** Points along a line, with ticks off one side; every `major`th is twice as long. */
function Ruler({ from, to, n, len = 1.6, major = 5, flip = false }: { from: Pt; to: Pt; n: number; len?: number; major?: number; flip?: boolean }) {
  const dx = (to[0] - from[0]) / n;
  const dy = (to[1] - from[1]) / n;
  const k = Math.hypot(dx, dy) * (flip ? -1 : 1);
  const [nx, ny] = [-dy / k, dx / k];
  let d = "";
  for (let i = 0; i <= n; i++) {
    const x = from[0] + dx * i;
    const y = from[1] + dy * i;
    const l = i % major === 0 ? len * 2 : len;
    d += `M${r(x)} ${r(y)}l${r(nx * l)} ${r(ny * l)}`;
  }
  return <path d={d} />;
}

/** A measurement: a line with arrowheads, between two end bars. */
function Dim({ from, to, bar = 3 }: { from: Pt; to: Pt; bar?: number }) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const [ux, uy] = [(to[0] - from[0]) / len, (to[1] - from[1]) / len];
  const [nx, ny] = [-uy, ux];
  const head = (p: Pt, s: number) =>
    `M${r(p[0] + s * (ux * 1.6 + nx * 0.9))} ${r(p[1] + s * (uy * 1.6 + ny * 0.9))}L${r(p[0])} ${r(p[1])}L${r(p[0] + s * (ux * 1.6 - nx * 0.9))} ${r(p[1] + s * (uy * 1.6 - ny * 0.9))}`;
  const endBar = (p: Pt) => `M${r(p[0] - nx * bar)} ${r(p[1] - ny * bar)}l${r(nx * bar * 2)} ${r(ny * bar * 2)}`;
  return <path d={`M${from[0]} ${from[1]}L${to[0]} ${to[1]}${head(from, 1)}${head(to, -1)}${endBar(from)}${endBar(to)}`} />;
}

/** A small ring on two crossed lines: a marked point. */
function Mark({ at: [x, y], ring = 2, arm = 9 }: { at: Pt; ring?: number; arm?: number }) {
  return (
    <>
      <circle cx={x} cy={y} r={ring} />
      <path d={`M${x - arm} ${y}h${arm * 2}M${x} ${y - arm}v${arm * 2}`} />
    </>
  );
}

/** Lines drawn lighter and dashed, for construction guides. */
function Guide({ children }: { children: ReactNode }) {
  return (
    <g className="card-lines-guide" strokeDasharray="1.6 1.4">
      {children}
    </g>
  );
}

/** Factful, checking claims: a lens over the page, measured, with a tick inside. */
export const factfulLines: LineArt = () => (
  <>
    <Ruler from={[4, 4]} to={[96, 4]} n={30} />
    <Ruler from={[96, 4]} to={[96, 96]} n={30} flip />
    <path d="M44 100A56 56 0 0 1 100 44" />
    <path d="M70 100A30 30 0 0 1 100 70" className="card-lines-faint" />
    <circle cx="76" cy="76" r="11" />
    <path d="M68.5 77l5 5 9-11" />
    <Mark at={[76, 76]} ring={1} arm={15} />
    <Guide>
      <path d="M20 20L100 100" />
    </Guide>
    <Dim from={[65, 92]} to={[87, 92]} />
  </>
);

/** Bricked, LEGO: a 2 x 2 brick in isometric, its studs, sized up on two sides. */
export const brickedLines: LineArt = () => {
  // the brick's top face corners, and how far it stands
  const [cx, cy, w, h] = [78, 74, 14, 8];
  const top: Pt[] = [
    [cx, cy - w / 2],
    [cx + w * 0.87, cy],
    [cx, cy + w / 2],
    [cx - w * 0.87, cy],
  ];
  const studs: Pt[] = [
    [cx, cy - w / 4],
    [cx + w * 0.43, cy],
    [cx, cy + w / 4],
    [cx - w * 0.43, cy],
  ];
  return (
    <>
      <Ruler from={[4, 6]} to={[4, 94]} n={22} flip />
      <Guide>
        <path d="M30 100L100 60M10 100L100 48M60 100L100 77" />
      </Guide>
      <path d={`M${top.map((p) => p.join(" ")).join("L")}Z`} />
      <path d={`M${top[3][0]} ${top[3][1]}v${h}L${top[2][0]} ${top[2][1] + h}L${top[1][0]} ${top[1][1] + h}V${top[1][1]}M${top[2][0]} ${top[2][1]}v${h}`} />
      {studs.map(([x, y], i) => (
        <path key={i} d={`M${r(x - 2.2)} ${y}v-1.6a2.2 1.2 0 0 0 4.4 0v1.6a2.2 1.2 0 0 1 -4.4 0`} />
      ))}
      <Dim from={[top[3][0] + 1.5, top[3][1] + h + 4.5]} to={[top[2][0] + 1.5, top[2][1] + h + 4.5]} bar={1.5} />
      <Mark at={[top[0][0], top[0][1]]} ring={1.2} arm={6} />
      <path d="M96 6h-12M96 6v12" />
    </>
  );
};

/** Weekloom, the week as a Gantt chart: seven days, bars across them, a dashed today. */
export const weekloomLines: LineArt = () => {
  const days = [62, 67, 72, 77, 82, 87, 92];
  return (
    <>
      <Ruler from={[4, 4]} to={[96, 4]} n={28} />
      <path d={days.map((x) => `M${x} 66v26`).join("")} className="card-lines-faint" />
      {[
        [62, 68, 12],
        [67, 73, 20],
        [72, 78, 10],
        [77, 83, 15],
        [67, 88, 8],
      ].map(([x, y, w]) => (
        <rect key={y} x={x} y={y} width={w} height="3" rx="1.5" />
      ))}
      <Guide>
        <path d="M79.5 64V96" />
      </Guide>
      <Mark at={[79.5, 64]} ring={1.2} arm={4} />
      <Dim from={[67, 96]} to={[87, 96]} bar={1.2} />
    </>
  );
};

/** WMOJ, code graded in sandboxes: nested containers, and a run of test cases. */
export const wmojLines: LineArt = () => (
  <>
    <Ruler from={[96, 4]} to={[96, 96]} n={30} flip />
    <rect x="56" y="64" width="34" height="26" rx="2" />
    <rect x="60" y="68" width="26" height="18" rx="1.5" className="card-lines-faint" />
    <path d="M67 73l-4 4 4 4M79 73l4 4-4 4M74.5 72.5l-3 9" />
    <Guide>
      <path d="M56 64L36 44M90 64L100 54" />
    </Guide>
    <path d="M8 4h86" className="card-lines-faint" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <circle key={i} cx={58 + i * 5} cy="96" r="1" />
    ))}
    <Dim from={[56, 60]} to={[90, 60]} bar={1.5} />
  </>
);

/** WatWiki, lectures into linked notes: a recording's waveform, and pages linked up. */
export const watwikiLines: LineArt = () => {
  const wave = Array.from({ length: 38 }, (_, i) => {
    const a = Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37)) * 4 + 0.6;
    return `M${6 + i * 2.4} ${r(10 - a)}v${r(a * 2)}`;
  }).join("");
  const nodes: Pt[] = [
    [68, 70],
    [84, 62],
    [92, 80],
    [78, 90],
    [60, 86],
  ];
  return (
    <>
      <path d={wave} />
      <Ruler from={[4, 18]} to={[96, 18]} n={46} len={1} />
      <path d="M68 70L84 62L92 80L78 90L68 70L92 80M60 86L68 70M60 86L78 90" className="card-lines-faint" />
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 2.4 : 1.4} />
      ))}
      <Mark at={nodes[0]} ring={4} arm={8} />
      <Guide>
        <path d="M96 10Q96 50 68 70" />
      </Guide>
    </>
  );
};

/** Scire, scheduling tutors: a clock face off the corner, and a month of sessions. */
export const scireLines: LineArt = () => {
  const [cx, cy, rad] = [100, 0, 30];
  let ticks = "";
  for (let i = 0; i <= 12; i++) {
    const a = (90 + i * 7.5) * (Math.PI / 180);
    const l = i % 3 === 0 ? 4 : 2;
    ticks += `M${r(cx + Math.cos(a) * rad)} ${r(cy + Math.sin(a) * rad)}L${r(cx + Math.cos(a) * (rad - l))} ${r(cy + Math.sin(a) * (rad - l))}`;
  }
  const dots = [];
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 7; col++) {
      const on = (row * 7 + col) % 5 === 2;
      dots.push(<circle key={`${row}-${col}`} cx={58 + col * 5.5} cy={70 + row * 6} r={on ? 1.3 : 0.5} />);
    }
  return (
    <>
      <path d={`M${cx - rad} 0A${rad} ${rad} 0 0 0 100 ${rad}`} />
      <path d={`M${cx - rad - 8} 0A${rad + 8} ${rad + 8} 0 0 0 100 ${rad + 8}`} className="card-lines-faint" />
      <path d={ticks} />
      <path d="M100 0L82 14" />
      <Ruler from={[4, 96]} to={[4, 30]} n={22} />
      {dots}
      <Guide>
        <path d="M56 66H96M56 94H96" />
      </Guide>
    </>
  );
};

/** Jazzba, a warehouse moving stock: a barcode down the side, boxes on a belt. */
export const jazzbaLines: LineArt = () => {
  const bars = [1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 1];
  let y = 8;
  let code = "";
  for (const b of bars) {
    code += `M${92 - b * 2} ${y}H96`;
    y += 3;
  }
  return (
    <>
      <path d={code} />
      <rect x="54" y="74" width="12" height="10" rx="0.6" />
      <rect x="68" y="70" width="12" height="14" rx="0.6" />
      <path d="M54 79h12M60 74v5M68 77h12M74 70v7" className="card-lines-faint" />
      <path d="M48 86H90" />
      {[52, 60, 68, 76, 84].map((x) => (
        <circle key={x} cx={x} cy="89" r="2" className="card-lines-faint" />
      ))}
      <Guide>
        <path d="M48 93H90M84 74h6" />
      </Guide>
      <path d="M86 74l4 0l-1.5 -1.5M90 74l-1.5 1.5" />
      <Dim from={[54, 66]} to={[80, 66]} bar={1.5} />
    </>
  );
};

/** Draws a card's line art; aria-hidden as it's decoration. */
export function CardLines({ art: Art }: { art: LineArt }) {
  return (
    <svg className="card-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <Art />
    </svg>
  );
}
