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
    <circle cx="77" cy="81" r="9" />
    <path d="M71 82l4 4 7.5-9" />
    <Mark at={[77, 81]} ring={1} arm={13} />
    <Guide>
      <path d="M20 20L100 100" />
    </Guide>
    <Dim from={[68, 95]} to={[86, 95]} bar={1.5} />
  </>
);

/** Bricked, LEGO: a 2 x 2 brick in isometric, its studs, sized up on two sides. */
export const brickedLines: LineArt = () => {
  // the brick's top face corners, and how far it stands
  const [cx, cy, w, h] = [78, 78, 13, 7];
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
      <path d={days.map((x) => `M${x} 71v24`).join("")} className="card-lines-faint" />
      {[
        [62, 73, 12],
        [67, 77.5, 20],
        [72, 82, 10],
        [77, 86.5, 15],
        [67, 91, 8],
      ].map(([x, y, w]) => (
        <rect key={y} x={x} y={y} width={w} height="2.6" rx="1.3" />
      ))}
      <Guide>
        <path d="M79.5 71V97" />
      </Guide>
      <Mark at={[79.5, 71]} ring={1.2} arm={4} />
      <Dim from={[67, 97]} to={[87, 97]} bar={1.2} />
    </>
  );
};

/** WMOJ, code graded in sandboxes: nested containers, and a run of test cases. */
export const wmojLines: LineArt = () => (
  <>
    <Ruler from={[96, 4]} to={[96, 96]} n={30} flip />
    <rect x="58" y="72" width="32" height="20" rx="2" />
    <rect x="61.5" y="75" width="25" height="14" rx="1.5" className="card-lines-faint" />
    <path d="M68 78.5l-3.5 3.5 3.5 3.5M80 78.5l3.5 3.5-3.5 3.5M75.5 78l-3 8" />
    <Guide>
      <path d="M58 72L44 70M90 72L100 70" />
    </Guide>
    <path d="M8 4h86" className="card-lines-faint" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <circle key={i} cx={58 + i * 5} cy="96" r="1" />
    ))}
    
  </>
);

/** WatWiki, lectures into linked notes: a recording's waveform, and pages linked up. */
export const watwikiLines: LineArt = () => {
  const wave = Array.from({ length: 38 }, (_, i) => {
    const a = Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37)) * 4 + 0.6;
    return `M${6 + i * 2.4} ${r(10 - a)}v${r(a * 2)}`;
  }).join("");
  const nodes: Pt[] = [
    [68, 78],
    [84, 72],
    [92, 86],
    [78, 94],
    [60, 91],
  ];
  return (
    <>
      <path d={wave} />
      <Ruler from={[4, 18]} to={[96, 18]} n={46} len={1} />
      <path d="M68 78L84 72L92 86L78 94L68 78L92 86M60 91L68 78M60 91L78 94" className="card-lines-faint" />
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 2.4 : 1.4} />
      ))}
      <Mark at={nodes[0]} ring={4} arm={8} />
      <Guide>
        <path d="M98 30Q98 66 68 78" />
      </Guide>
    </>
  );
};

/** Dr. Rocket, a Racket IDE: a launch arc up the side, and the call tree its Visualizer draws. */
export const drrocketLines: LineArt = () => {
  const tree: [Pt, Pt][] = [
    [[78, 70], [70, 80]],
    [[78, 70], [86, 80]],
    [[70, 80], [65, 90]],
    [[70, 80], [75, 90]],
    [[86, 80], [91, 90]],
  ];
  const nodes: Pt[] = [[78, 70], [70, 80], [86, 80], [65, 90], [75, 90], [91, 90]];
  return (
    <>
      <path d="M66 100C76 70 88 40 96 4" />
      <path d="M60 100C70 70 82 40 90 4" className="card-lines-faint" />
      <Ruler from={[4, 96]} to={[4, 30]} n={22} />
      <path d={tree.map(([a, b]) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`).join("")} />
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 1.8 : 1.2} />
      ))}
      <Mark at={[96, 4]} ring={2.5} arm={6} />
      <Guide>
        <path d="M60 64H96M60 96H96" />
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
      <rect x="54" y="77" width="12" height="9" rx="0.6" />
      <rect x="68" y="74.5" width="12" height="11.5" rx="0.6" />
      <path d="M54 81.5h12M60 77v4.5M68 80h12M74 74.5v5.5" className="card-lines-faint" />
      <path d="M48 86H90" />
      {[52, 60, 68, 76, 84].map((x) => (
        <circle key={x} cx={x} cy="89" r="2" className="card-lines-faint" />
      ))}
      <Guide>
        <path d="M48 93H90M82 78h8" />
      </Guide>
      <path d="M88.5 76.5L90 78l-1.5 1.5" />
      <Dim from={[54, 71]} to={[80, 71]} bar={1.2} />
    </>
  );
};

/**
 * Quartermaster, a crew of agents each on its own branch: a git graph along the
 * bottom (work forks off main and merges back), and a compass above it.
 */
export const quartermasterLines: LineArt = () => {
  const commits: Pt[] = [[52, 90], [62, 90], [74, 90], [86, 90], [94, 90]];
  // compass ticks round the ring, longer at the four points
  let ticks = "";
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    const l = i % 6 === 0 ? 1.8 : 0.8;
    ticks += `M${r(90 + c * 5.5)} ${r(75 + s * 5.5)}L${r(90 + c * (5.5 - l))} ${r(75 + s * (5.5 - l))}`;
  }
  return (
    <>
      <path d="M48 90H96" />
      <path d="M57 90C59 82 61 80 66 80H76C81 80 83 82 85 90" />
      <path d="M66 90C68 85 70 84 73 84H80" className="card-lines-faint" />
      {commits.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.3} />
      ))}
      <circle cx="71" cy="80" r="1.1" />
      <circle cx="80" cy="84" r="1" className="card-lines-faint" />
      <circle cx="90" cy="75" r="5.5" />
      <path d={ticks} />
      <path d="M90 71.2L91 75L90 78.8L89 75Z" />
      <Ruler from={[4, 96]} to={[4, 40]} n={20} />
      <Guide>
        <path d="M48 96H96M90 66V69M80 75H84" />
      </Guide>
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
