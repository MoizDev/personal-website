// Tangram geometry.
//
// Pieces live on the lattice of the classic 4x4 square dissection. A figure
// places each piece by a quarter-turn count `k`, an optional mirror, and an
// integer offset. Every figure here was checked offline to use all seven
// pieces with no overlaps.

export type Point = readonly [number, number];
export type PieceId = "L1" | "L2" | "M" | "Q" | "S1" | "S2" | "P";

export const PIECE_IDS: PieceId[] = ["L1", "L2", "M", "Q", "P", "S1", "S2"];

/** Pieces as they sit in the 4x4 square. */
const SQUARE_POLYS: Record<PieceId, Point[]> = {
  L1: [[0, 0], [4, 0], [2, 2]],
  L2: [[0, 0], [2, 2], [0, 4]],
  M: [[4, 2], [4, 4], [2, 4]],
  Q: [[2, 2], [3, 3], [2, 4], [1, 3]],
  S1: [[0, 4], [1, 3], [2, 4]],
  S2: [[2, 2], [3, 1], [3, 3]],
  P: [[3, 1], [4, 0], [4, 2], [3, 3]],
};

type Placement = { k: number; flip: boolean; dx: number; dy: number };

export const FIGURES = {
  square: {
    L1: { k: 0, flip: false, dx: 0, dy: 0 },
    L2: { k: 0, flip: false, dx: 0, dy: 0 },
    M: { k: 0, flip: false, dx: 0, dy: 0 },
    P: { k: 0, flip: false, dx: 0, dy: 0 },
    Q: { k: 0, flip: false, dx: 0, dy: 0 },
    S1: { k: 0, flip: false, dx: 0, dy: 0 },
    S2: { k: 0, flip: false, dx: 0, dy: 0 },
  },
  cat: {
    L1: { k: 3, flip: false, dx: 1, dy: 6 },
    L2: { k: 3, flip: false, dx: 1, dy: 6 },
    M: { k: 3, flip: false, dx: 1, dy: 8 },
    P: { k: 0, flip: false, dx: 2, dy: 3 },
    Q: { k: 0, flip: false, dx: 0, dy: -1 },
    S1: { k: 1, flip: false, dx: 5, dy: 0 },
    S2: { k: 0, flip: false, dx: 0, dy: -1 },
  },
  swan: {
    L1: { k: 1, flip: false, dx: 4, dy: 0 },
    L2: { k: 3, flip: false, dx: 0, dy: 4 },
    M: { k: 2, flip: false, dx: 6, dy: 4 },
    P: { k: 0, flip: false, dx: -3, dy: 1 },
    Q: { k: 0, flip: false, dx: -2, dy: -2 },
    S1: { k: 1, flip: false, dx: 8, dy: 2 },
    S2: { k: 1, flip: false, dx: 1, dy: -1 },
  },
  fish: {
    L1: { k: 1, flip: false, dx: 2, dy: 0 },
    L2: { k: 0, flip: false, dx: 2, dy: 0 },
    M: { k: 0, flip: false, dx: 2, dy: -2 },
    P: { k: 0, flip: false, dx: -1, dy: 3 },
    Q: { k: 0, flip: false, dx: 1, dy: -3 },
    S1: { k: 2, flip: false, dx: 6, dy: 6 },
    S2: { k: 0, flip: false, dx: 3, dy: 1 },
  },
} satisfies Record<string, Record<PieceId, Placement>>;

export type FigureName = keyof typeof FIGURES;
export const FIGURE_NAMES = Object.keys(FIGURES) as FigureName[];

const centroid = (poly: readonly Point[]): Point => {
  const n = poly.length;
  return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
};

/** Quarter turns clockwise (screen space, y down), mirroring x first. */
const orient = ([x, y]: Point, k: number, flip: boolean): Point => {
  let px = flip ? -x : x;
  let py = y;
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) [px, py] = [-py, px];
  return [px, py];
};

/** Each piece's outline centred on its own centroid, so it spins in place. */
export const LOCAL_POLYS: Record<PieceId, Point[]> = Object.fromEntries(
  PIECE_IDS.map((id) => {
    const [cx, cy] = centroid(SQUARE_POLYS[id]);
    return [id, SQUARE_POLYS[id].map(([x, y]) => [x - cx, y - cy] as Point)];
  }),
) as Record<PieceId, Point[]>;

export type PiecePose = { x: number; y: number; angle: number; flip: boolean };

/** Where each piece's centre lands, and how it is turned, in lattice units. */
function figurePoses(name: FigureName): Record<PieceId, PiecePose> {
  const fig: Record<PieceId, Placement> = FIGURES[name];
  return Object.fromEntries(
    PIECE_IDS.map((id) => {
      const { k, flip, dx, dy } = fig[id];
      const [cx, cy] = orient(centroid(SQUARE_POLYS[id]), k, flip);
      return [id, { x: cx + dx, y: cy + dy, angle: k * 90, flip }];
    }),
  ) as Record<PieceId, PiecePose>;
}

const posedPoly = (id: PieceId, pose: PiecePose): Point[] =>
  LOCAL_POLYS[id].map((p) => {
    const [x, y] = orient(p, pose.angle / 90, pose.flip);
    return [x + pose.x, y + pose.y];
  });

export type StagePose = PiecePose & { scale: number };

/**
 * Fit a figure into a square stage `size` px wide, keeping `pad` px clear.
 * Returns each piece's pose in stage pixels.
 */
export function layoutFigure(name: FigureName, size: number, pad: number): Record<PieceId, StagePose> {
  const poses = figurePoses(name);
  const pts = PIECE_IDS.flatMap((id) => posedPoly(id, poses[id]));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const scale = (size - pad * 2) / Math.max(w, h);
  const ox = (size - w * scale) / 2;
  const oy = (size - h * scale) / 2;
  return Object.fromEntries(
    PIECE_IDS.map((id) => {
      const p = poses[id];
      return [id, { ...p, x: ox + (p.x - minX) * scale, y: oy + (p.y - minY) * scale, scale }];
    }),
  ) as Record<PieceId, StagePose>;
}

/**
 * SVG path for a convex polygon pulled in by `inset` and with corners rounded
 * by `radius`. The inset leaves a hairline gap between neighbouring pieces,
 * like a wooden set sitting in its tray.
 */
export function softPath(poly: readonly Point[], inset: number, radius: number): string {
  const n = poly.length;
  const signedArea = poly.reduce((s, [x, y], i) => {
    const [x2, y2] = poly[(i + 1) % n];
    return s + x * y2 - x2 * y;
  }, 0);
  const dir = signedArea > 0 ? 1 : -1;

  // shift every edge inward, then intersect neighbours
  const lines = poly.map((a, i) => {
    const b = poly[(i + 1) % n];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const len = Math.hypot(ex, ey);
    const nx = (-ey / len) * dir;
    const ny = (ex / len) * dir;
    return { px: a[0] + nx * inset, py: a[1] + ny * inset, ex, ey };
  });
  const inner: Point[] = poly.map((_, i) => {
    const l1 = lines[(i - 1 + n) % n];
    const l2 = lines[i];
    const den = l1.ex * l2.ey - l1.ey * l2.ex;
    const t = ((l2.px - l1.px) * l2.ey - (l2.py - l1.py) * l2.ex) / den;
    return [l1.px + l1.ex * t, l1.py + l1.ey * t];
  });

  const f = (v: number) => +v.toFixed(4);
  const toward = (a: Point, b: Point, d: number): Point => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t = Math.min(d, len / 2) / len;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  let d = "";
  inner.forEach((v, i) => {
    const prev = inner[(i - 1 + n) % n];
    const next = inner[(i + 1) % n];
    const a = toward(v, prev, radius);
    const b = toward(v, next, radius);
    d += `${i === 0 ? "M" : "L"}${f(a[0])} ${f(a[1])}Q${f(v[0])} ${f(v[1])} ${f(b[0])} ${f(b[1])}`;
  });
  return d + "Z";
}
