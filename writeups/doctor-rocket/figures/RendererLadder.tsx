"use client";

/**
 * The renderer fallback (src/startup.rs). Each launch leaves a `starting`
 * marker until three frames have painted. A launch that finds the marker knows
 * the last one died in the graphics driver and steps one rung down; a setup
 * error relaunches at the next rung straight away, through DRROCKET_RENDERER.
 * The rung that works is remembered in the `renderer` file.
 */

import { useRef } from "react";
import { Controls } from "@/components/diagram/Controls";
import { useSequence } from "@/components/diagram/usePlayback";

type RungId = "default" | "dx12" | "opengl" | "software";
const RUNGS: { id: RungId; label: string; sub: string }[] = [
  { id: "default", label: "Automatic", sub: "wgpu picks: Vulkan or DirectX 12" },
  { id: "dx12", label: "DirectX 12", sub: "on the GPU, Windows only" },
  { id: "opengl", label: "OpenGL", sub: "on the GPU, nearly any driver" },
  { id: "software", label: "Software", sub: "the CPU: WARP or llvmpipe" },
];

type State = "trying" | "failed" | "works";
type Step = {
  launch: number;
  rungs: Partial<Record<RungId, State>>;
  marker: boolean;
  file: string | null;
  env?: string;
  log: string;
};

const STEPS: Step[] = [
  { launch: 1, rungs: { default: "trying" }, marker: true, file: null, log: "Launch 1 writes the starting marker and sets up the default renderer." },
  { launch: 1, rungs: { default: "failed" }, marker: true, file: null, log: "The Vulkan driver crashes before a frame paints. The marker stays behind." },
  { launch: 2, rungs: { default: "failed", dx12: "trying" }, marker: true, file: "dx12", log: "Launch 2 finds the marker: the last launch died, so it steps down and remembers dx12." },
  { launch: 2, rungs: { default: "failed", dx12: "failed" }, marker: false, file: "opengl", env: "opengl", log: "DirectX 12 can't create the window: a setup error, so it relaunches at once with the next rung." },
  { launch: 3, rungs: { default: "failed", dx12: "failed", opengl: "trying" }, marker: true, file: "opengl", env: "opengl", log: "Launch 3 starts on OpenGL, named by DRROCKET_RENDERER." },
  { launch: 3, rungs: { default: "failed", dx12: "failed", opengl: "works" }, marker: false, file: "opengl", env: "opengl", log: "Three frames paint: the marker is deleted, and OpenGL is this machine's renderer from now on." },
];

const MARK: Record<State, string> = { trying: "…", failed: "✕", works: "✓" };

export function RendererLadder() {
  const ref = useRef<HTMLDivElement>(null);
  const seq = useSequence(ref, STEPS.length, { delay: [600, 1500, 1900, 2100, 1900, 1900], loop: true, hold: 3600 });
  const s = seq.step < 0 ? null : STEPS[seq.step];

  return (
    <div ref={ref} className="drf-ladder" data-tone="blue">
      <Controls seq={seq} label={s ? `Launch ${s.launch}` : undefined} />
      <ol className="drf-ladder-rungs" aria-label="Renderers, tried top to bottom">
        {RUNGS.map((r, i) => {
          const st = s?.rungs[r.id];
          return (
            <li key={r.id} className="drf-ladder-rung" data-state={st}>
              <span className="drf-ladder-n drf-mono">{i + 1}</span>
              <span className="drf-ladder-text">
                <span className="drf-ladder-label">{r.label}</span>
                <span className="drf-ladder-sub drf-mono">{r.sub}</span>
              </span>
              <span className="drf-ladder-mark" aria-hidden>
                {st ? MARK[st] : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="drf-ladder-side">
        <div className="drf-ladder-files">
          <span className="drf-ladder-file drf-mono" data-on={s?.marker ? "" : undefined}>
            <span className="drf-ladder-file-name">starting</span>
            <span>{s ? (s.marker ? "present" : "deleted") : "·"}</span>
          </span>
          <span className="drf-ladder-file drf-mono" data-on={s?.file ? "" : undefined}>
            <span className="drf-ladder-file-name">renderer</span>
            <span>{s?.file ?? "none"}</span>
          </span>
          <span className="drf-ladder-file drf-mono" data-on={s?.env ? "" : undefined}>
            <span className="drf-ladder-file-name">DRROCKET_RENDERER</span>
            <span>{s?.env ?? "unset"}</span>
          </span>
        </div>
        <p className="drf-ladder-log" aria-live="polite" key={seq.step}>
          {s?.log ?? " "}
        </p>
      </div>
    </div>
  );
}
