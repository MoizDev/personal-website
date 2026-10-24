"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PROJECTS, type Project } from "@/lib/projects";

const N = PROJECTS.length;
const LOOPS = 3;
/** card elements in the loop; the projects come round LOOPS times */
const M = N * LOOPS;
/** slots that can sit in front of the focus card before wrapping to the back */
const AHEAD = 2;
/** on load the stack starts this many cards back and flies in */
const START = -7;
/** how much faster cards travel once they pass in front of the focus card */
const FLY_OUT = 2.2;

// Motion tuning. Speeds are in cards per second.
const FOLLOW = 6.5; // how quickly the stack catches up with the scroll target
const WHEEL = 0.0028; // cards per wheel pixel
const DRAG = 0.0075; // cards per dragged pixel
const MAX_LEAD = 4; // how far the target may run ahead of the stack, in cards
const SNAP_DELAY = 160; // ms of quiet before settling on a card
const TILT_PER_SPEED = 5; // degrees of swing per card/s
const MAX_TILT = 30;
const TILT_RESPONSE = 11; // how fast the focus card answers a change in speed

const wrap = (v: number, m: number) => ((v % m) + m) % m;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Slot of card j when the stack is at `cur`. 0 is the focus card, bigger is further back. */
const slotOf = (j: number, cur: number) => wrap(j - cur + AHEAD, M) - AHEAD;

/**
 * Where a card sits for a given slot. The path itself (start point, step,
 * angle) lives in CSS variables so each breakpoint can shape the stack.
 */
function place(s: number, tilt: number) {
  const back = M - AHEAD - s; // distance to the back of the stack, where cards wrap round
  const opacity = clamp(back / 3, 0, 1) * clamp((s + AHEAD) / 0.35, 0, 1);
  // cards that pass the focus card speed up and leave off the bottom-left edge
  const n = (s < 0 ? s * FLY_OUT : s).toFixed(4);
  return {
    transform:
      `translate3d(calc(var(--card-w) * (var(--x0) + ${n} * var(--dx))), ` +
      `calc(var(--card-w) * (var(--y0) + ${n} * var(--dy))), ` +
      `calc(var(--card-w) * ${n} * var(--dz))) ` +
      `rotateY(calc(var(--ry) + ${tilt.toFixed(3)}deg))`,
    opacity,
    fog: clamp(s * 0.07, 0, 0.82),
  };
}

// Server render and first paint use the start pose. These objects never change,
// so later re-renders leave the per-frame inline styles alone.
const INITIAL: CSSProperties[] = Array.from({ length: M }, (_, j) => {
  const p = place(slotOf(j, START), 0);
  return {
    transform: p.transform,
    opacity: p.opacity,
    visibility: p.opacity < 0.01 ? "hidden" : undefined,
    ["--fog" as string]: p.fog.toFixed(3),
  };
});

export function CardStack() {
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const goTo = useRef<(j: number) => void>(() => {});
  const [focus, setFocus] = useState(wrap(START, N));
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const m = { cur: START, target: 0, vel: 0, last: 0, running: false };
    const tilts = new Float64Array(M);
    let raf = 0;
    let snapTimer = 0;
    let shownFocus = -1;

    function paint() {
      for (let j = 0; j < M; j++) {
        const el = cards.current[j];
        if (!el) continue;
        const p = place(slotOf(j, m.cur), tilts[j]);
        el.style.transform = p.transform;
        el.style.opacity = p.opacity.toFixed(3);
        el.style.visibility = p.opacity < 0.01 ? "hidden" : "";
        el.style.setProperty("--fog", p.fog.toFixed(3));
      }
      const f = wrap(Math.round(m.cur), N);
      if (f !== shownFocus) {
        shownFocus = f;
        setFocus(f);
      }
    }

    function tick(now: number) {
      const dt = Math.min((now - m.last) / 1000, 1 / 20);
      m.last = now;
      if (dt <= 0) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const prev = m.cur;
      m.cur += (m.target - m.cur) * (1 - Math.exp(-dt * (reduce ? 14 : FOLLOW)));
      if (Math.abs(m.target - m.cur) < 5e-4) m.cur = m.target;
      m.vel += ((m.cur - prev) / dt - m.vel) * (1 - Math.exp(-dt * 14));

      // Fast scrolling swings the cards; they ease back as it slows. Near
      // cards answer first, so the swing ripples down the stack.
      const want = reduce ? 0 : clamp(m.vel * TILT_PER_SPEED, -MAX_TILT, MAX_TILT);
      let still = m.cur === m.target && Math.abs(m.vel) < 1e-3;
      for (let j = 0; j < M; j++) {
        const s = Math.max(slotOf(j, m.cur), 0);
        tilts[j] += (want - tilts[j]) * (1 - Math.exp(-dt * (TILT_RESPONSE / (1 + s * 0.12))));
        if (Math.abs(tilts[j] - want) > 0.01) still = false;
      }

      paint();
      if (still) {
        m.vel = 0;
        m.running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    function kick() {
      if (m.running) return;
      m.running = true;
      m.last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function push(by: number) {
      setHover(null); // the card under the pointer is about to move away
      m.target = clamp(m.target + by, m.cur - MAX_LEAD, m.cur + MAX_LEAD);
      kick();
    }

    function settleSoon() {
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        m.target = Math.round(m.target);
        kick();
      }, SNAP_DELAY);
    }

    goTo.current = (j: number) => {
      m.target = Math.round(m.cur + slotOf(j, m.cur));
      kick();
    };

    function onWheel(e: WheelEvent) {
      if (e.ctrlKey) return; // pinch zoom
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      push(d * unit * WHEEL);
      settleSoon();
    }

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const forward = ["ArrowDown", "ArrowRight", "PageDown", "j"];
      const back = ["ArrowUp", "ArrowLeft", "PageUp", "k"];
      let step = forward.includes(e.key) ? 1 : back.includes(e.key) ? -1 : 0;
      if (e.key === " ") step = e.shiftKey ? -1 : 1;
      if (!step) return;
      e.preventDefault();
      setHover(null);
      m.target = Math.round(m.target) + step;
      kick();
    }

    // Dragging (touch or mouse) moves the stack too, and a flick carries on.
    let drag: { x: number; y: number; t: number; v: number; moved: number } | null = null;
    let swallowClick = false;

    function onDown(e: PointerEvent) {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, t: e.timeStamp, v: 0, moved: 0 };
      swallowClick = false;
      clearTimeout(snapTimer);
    }

    function onMove(e: PointerEvent) {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      const d = -(Math.abs(dy) >= Math.abs(dx) ? dy : dx) * DRAG;
      const dt = Math.max((e.timeStamp - drag.t) / 1000, 1 / 240);
      drag.v = drag.v * 0.6 + (d / dt) * 0.4;
      drag.moved += Math.hypot(dx, dy);
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.t = e.timeStamp;
      push(d);
    }

    function onUp() {
      if (!drag) return;
      if (drag.moved > 6) {
        swallowClick = true;
        push(clamp(drag.v * 0.28, -MAX_LEAD, MAX_LEAD));
      }
      drag = null;
      settleSoon();
    }

    function onClick(e: MouseEvent) {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("click", onClick, true);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(snapTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  const shown = PROJECTS[hover === null ? focus : hover % N];
  const shownIndex = PROJECTS.indexOf(shown);

  return (
    <>
      <div className="scene" aria-label="Projects">
        <div className="track">
          {Array.from({ length: M }, (_, j) => {
            const p = PROJECTS[j % N];
            const copy = j >= N;
            return (
              <a
                key={j}
                ref={(el) => {
                  cards.current[j] = el;
                }}
                className="card"
                data-hover={hover === j}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                draggable={false}
                aria-label={`${p.name}, ${p.year}. ${p.blurb}`}
                aria-hidden={copy || undefined}
                tabIndex={copy ? -1 : undefined}
                style={INITIAL[j]}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(j)}
                onPointerLeave={() => setHover((h) => (h === j ? null : h))}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && goTo.current(j)}
              >
                <CardFace project={p} />
              </a>
            );
          })}
        </div>
      </div>

      <div className="caption" aria-live="polite">
        <p className="caption-count">
          {String(shownIndex + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
        </p>
        <p className="caption-name">
          {shown.name} <span className="caption-year">{shown.year}</span>
        </p>
        <p className="caption-blurb">{shown.blurb}</p>
      </div>
    </>
  );
}

function CardFace({ project: p }: { project: Project }) {
  const style = { "--g1": p.glow[0], "--g2": p.glow[1] } as CSSProperties;
  return (
    <div className="card-face" style={style}>
      {p.art.kind === "shot" ? (
        <Image
          className="card-shot"
          src={p.art.src}
          alt=""
          sizes="(max-width: 640px) 80vw, 45vw"
          placeholder="blur"
          loading="eager"
          draggable={false}
        />
      ) : (
        <div className="card-logo">
          <Image className="card-logo-mark" src={p.art.src} alt="" draggable={false} loading="eager" />
          <span className="card-logo-name">{p.name}</span>
          <span className="card-logo-tag">{p.art.tagline}</span>
        </div>
      )}
    </div>
  );
}
