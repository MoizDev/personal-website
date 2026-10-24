"use client";

import { useMemo, useState } from "react";
import { PROJECTS, type Project } from "@/lib/projects";
import {
  FIGURE_NAMES,
  LOCAL_POLYS,
  layoutFigure,
  softPath,
  type FigureName,
  type PieceId,
} from "@/lib/tangram";
import { PiecePatterns } from "./PiecePatterns";

const STAGE = 400;
const PAD = 2;
const GAP = 0.03; // lattice units, about 3px at rest
const ROUND = 0.06;

// one path per piece, in the piece's own units
const PATHS = Object.fromEntries(
  PROJECTS.map((p) => [p.piece, softPath(LOCAL_POLYS[p.piece], GAP, ROUND)]),
) as Record<PieceId, string>;

/** Pick the turn equal to `target` (mod 360) that is closest to `from`. */
const nearestTurn = (from: number, target: number) =>
  target + 360 * Math.round((from - target) / 360);

export function Tangram() {
  const [figure, setFigure] = useState<FigureName>("square");
  const [active, setActive] = useState<PieceId | null>(null);
  const [angles, setAngles] = useState<Record<PieceId, number>>(() => {
    const start = layoutFigure("square", STAGE, PAD);
    return Object.fromEntries(PROJECTS.map((p) => [p.piece, start[p.piece].angle])) as Record<PieceId, number>;
  });

  const poses = useMemo(() => layoutFigure(figure, STAGE, PAD), [figure]);

  function rearrange(next: FigureName) {
    if (next === figure) return;
    const target = layoutFigure(next, STAGE, PAD);
    setAngles((prev) =>
      Object.fromEntries(
        PROJECTS.map((p) => [p.piece, nearestTurn(prev[p.piece], target[p.piece].angle)]),
      ) as Record<PieceId, number>,
    );
    setFigure(next);
  }

  const center = STAGE / 2;
  const activeProject = PROJECTS.find((p) => p.piece === active);

  return (
    <section id="projects" className="tangram" aria-label="Projects">
      <div className="tangram-stage-wrap">
        <svg
          className="tangram-stage"
          viewBox={`0 0 ${STAGE} ${STAGE}`}
          role="img"
          aria-label={`Seven projects arranged as a tangram ${figure}`}
          onMouseLeave={() => setActive(null)}
        >
          <defs>
            <PiecePatterns />
            <filter id="lift" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="var(--shadow)" floodOpacity="1" />
            </filter>
          </defs>

          {PROJECTS.map((p, i) => {
            const pose = poses[p.piece];
            const isActive = active === p.piece;
            // lifted pieces slide a little away from the middle of the figure
            const away = Math.hypot(pose.x - center, pose.y - center) || 1;
            const lift = isActive ? 7 : 0;
            const lx = ((pose.x - center) / away) * lift;
            const ly = ((pose.y - center) / away) * lift - (isActive ? 3 : 0);
            const sx = pose.flip ? -pose.scale : pose.scale;
            return (
              <g
                key={p.piece}
                className="piece-slot"
                data-dim={active !== null && !isActive}
                style={{ transform: `translate(${lx}px, ${ly}px)` }}
                filter={isActive ? "url(#lift)" : undefined}
              >
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={-1}
                  aria-hidden="true"
                  onMouseEnter={() => setActive(p.piece)}
                >
                  <g
                    className="piece"
                    style={{
                      transform: `translate(${pose.x}px, ${pose.y}px) rotate(${angles[p.piece]}deg) scale(${sx}, ${pose.scale})`,
                      ["--i" as string]: i,
                    }}
                  >
                    <path d={PATHS[p.piece]} style={{ fill: `var(--${p.tone}-bg)` }} />
                    <path d={PATHS[p.piece]} fill={`url(#pattern-${p.pattern})`} />
                  </g>
                </a>
              </g>
            );
          })}
        </svg>

        <div className="figure-switch" role="group" aria-label="Rearrange the pieces">
          {FIGURE_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={figure === name}
              onClick={() => rearrange(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <ol className="legend" onMouseLeave={() => setActive(null)}>
          {PROJECTS.map((p) => (
            <LegendRow
              key={p.piece}
              project={p}
              active={active === p.piece}
              dim={active !== null && active !== p.piece}
              onActive={() => setActive(p.piece)}
              onIdle={() => setActive(null)}
            />
          ))}
        </ol>
        <p className="legend-caption" aria-live="polite">
          {activeProject
            ? activeProject.blurb
            : "Seven projects, seven tangram pieces. The bigger the piece, the bigger the project."}
        </p>
      </div>
    </section>
  );
}

function LegendRow({
  project: p,
  active,
  dim,
  onActive,
  onIdle,
}: {
  project: Project;
  active: boolean;
  dim: boolean;
  onActive: () => void;
  onIdle: () => void;
}) {
  return (
    <li data-active={active} data-dim={dim}>
      <a
        href={p.href}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={onActive}
        onFocus={onActive}
        onBlur={onIdle}
      >
        <PieceGlyph piece={p.piece} tone={p.tone} />
        <span className="legend-name">{p.name}</span>
        <span className="legend-year">{p.year}</span>
        <span className="legend-blurb">{p.blurb}</span>
      </a>
    </li>
  );
}

/** The piece's own silhouette, used as a bullet in the legend. */
function PieceGlyph({ piece, tone }: { piece: PieceId; tone: Project["tone"] }) {
  const poly = LOCAL_POLYS[piece];
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  // every glyph shares one scale so sizes compare honestly
  const unit = 16 / 4;
  const size = 18;
  const ox = (size - w * unit) / 2 - minX * unit;
  const oy = (size - h * unit) / 2 - minY * unit;
  return (
    <svg className="legend-glyph" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <path
        d={softPath(poly, 0, 0.08)}
        transform={`translate(${ox} ${oy}) scale(${unit})`}
        style={{ fill: `var(--${tone}-bg)`, stroke: `var(--${tone}-ink)` }}
        strokeWidth={1 / unit}
        strokeOpacity={0.55}
      />
    </svg>
  );
}
