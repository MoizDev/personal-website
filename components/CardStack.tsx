"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PROJECTS, type Project } from "@/lib/projects";

/*
 * A row of square cards standing on a ground plane, like dominoes.
 *
 *   X  runs along the row. Scrolling slides every card along X, nothing else.
 *   Z  points up out of the ground. Hovering lifts a card along Z.
 *   The ground (the XY plane) is what moves with speed: speeding up pitches it
 *   down, slowing down springs it back up past rest, and it settles.
 *
 * In CSS terms the ground is the x/z plane of `.world`, "up" is -y, and the
 * camera angle is the world's rotateX (pitch) and rotateY (yaw).
 */

const N = PROJECTS.length;
const LOOPS = 7;
/** card elements in the loop; the projects come round LOOPS times */
const M = N * LOOPS;
/**
 * The far end, where cards wrap round, sits off the top of the screen at rest.
 * The last FOG slots fade out so a fast scroll (flatter ground) shows a haze, not an end.
 */
const FOG = 10;
/** slots in front of the focus card, on their way out past the camera */
const AHEAD = 4;
/** on load the row starts this many cards back and slides in */
const START = -6;

// Scroll. Positions are in cards, speeds in cards per second.
// The row chases the scroll target on a critically damped spring, so it eases
// in and out of every move instead of jumping to speed.
const GLIDE = 4.2; // spring frequency (rad/s); lower glides longer
const WHEEL = 0.0026; // cards per wheel pixel
const DRAG = 0.007; // cards per dragged pixel
const MAX_LEAD = 5; // how far the target may run ahead of the row, in cards
const SNAP_DELAY = 180; // ms of quiet before settling on a card

// Ground pitch. A soft, slightly bouncy spring chases a target set by speed.
const PITCH_PER_SPEED = 0.75; // degrees per card/s
const MAX_PITCH = 4.5;
const PITCH_FREQ = 4; // rad/s
const PITCH_DAMPING = 0.5; // under 1, so it swings back a touch past rest

const wrap = (v: number, m: number) => ((v % m) + m) % m;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Slot of card j when the row is at `cur`. 0 is the focus card, bigger is further down the row. */
const slotOf = (j: number, cur: number) => wrap(j - cur + AHEAD, M) - AHEAD;

/**
 * `leave` is how many slots a card stays visible after it passes the focus,
 * from the --leave CSS variable (narrow screens fade them sooner).
 */
function cardPose(s: number, leave = AHEAD) {
  const back = M - AHEAD - s; // distance to the far end, where cards wrap round
  const opacity = clamp(back / FOG, 0, 1) * clamp((s + leave) / 0.6, 0, 1);
  return {
    transform: `translate3d(calc(var(--card-w) * var(--gap) * ${s.toFixed(4)}), 0, 0) rotateY(-90deg)`,
    opacity,
  };
}

const worldTransform = (pitch: number) =>
  `translate3d(var(--ox), var(--oy), 0) rotateX(calc(var(--pitch) + ${pitch.toFixed(3)}deg)) rotateY(var(--yaw))`;

// Server render and first paint use the start pose. These objects never change,
// so re-renders leave the per-frame inline styles alone.
const INITIAL: CSSProperties[] = Array.from({ length: M }, (_, j) => {
  const p = cardPose(slotOf(j, START));
  return { transform: p.transform, opacity: p.opacity, visibility: p.opacity < 0.01 ? "hidden" : undefined };
});
const INITIAL_WORLD: CSSProperties = { transform: worldTransform(0) };

export function CardStack() {
  const world = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const goTo = useRef<(j: number) => void>(() => {});
  const [focus, setFocus] = useState(wrap(START, N));
  const [hover, setHover] = useState<number | null>(null);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const q = matchMedia("(hover: none)");
    const sync = () => setTouch(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const m = { cur: START, target: 0, vel: 0, pitch: 0, pitchVel: 0, last: 0, running: false };
    const glide = reduce ? 16 : GLIDE;
    let raf = 0;
    let snapTimer = 0;
    let shownFocus = -1;
    let leave = AHEAD;

    function readLeave() {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--leave"));
      leave = Number.isFinite(v) ? clamp(v, 0.6, AHEAD) : AHEAD;
    }

    function paint() {
      for (let j = 0; j < M; j++) {
        const el = cards.current[j];
        if (!el) continue;
        const p = cardPose(slotOf(j, m.cur), leave);
        el.style.transform = p.transform;
        el.style.opacity = p.opacity.toFixed(3);
        el.style.visibility = p.opacity < 0.01 ? "hidden" : "";
      }
      if (world.current) world.current.style.transform = worldTransform(m.pitch);
      const f = wrap(Math.round(m.cur), N);
      if (f !== shownFocus) {
        shownFocus = f;
        setFocus(f);
      }
    }

    function tick(now: number) {
      const dt = Math.min((now - m.last) / 1000, 1 / 30);
      m.last = now;
      if (dt <= 0) {
        raf = requestAnimationFrame(tick);
        return;
      }

      m.vel += (glide * glide * (m.target - m.cur) - 2 * glide * m.vel) * dt;
      m.cur += m.vel * dt;
      if (Math.abs(m.target - m.cur) < 5e-4 && Math.abs(m.vel) < 5e-3) {
        m.cur = m.target;
        m.vel = 0;
      }

      const want = reduce ? 0 : clamp(m.vel * PITCH_PER_SPEED, -MAX_PITCH, MAX_PITCH);
      const f = PITCH_FREQ;
      m.pitchVel += (f * f * (want - m.pitch) - 2 * PITCH_DAMPING * f * m.pitchVel) * dt;
      m.pitch += m.pitchVel * dt;

      paint();
      const still = m.cur === m.target && Math.abs(m.pitch) < 0.01 && Math.abs(m.pitchVel) < 0.01;
      if (still) {
        m.pitch = 0;
        m.pitchVel = 0;
        paint();
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
      setHover(null); // the card under the pointer is about to slide away
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

    // Dragging (touch or mouse) slides the row too, and a flick carries on.
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
      if (drag.moved > 6) push(d);
    }

    function onUp() {
      if (!drag) return;
      if (drag.moved > 6) {
        swallowClick = true;
        push(clamp(drag.v * 0.25, -MAX_LEAD, MAX_LEAD));
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

    function onResize() {
      readLeave();
      paint();
    }

    readLeave();
    window.addEventListener("resize", onResize);
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
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  // Like the reference: the title shows for the card you point at. Touch
  // screens can't point, so they show the card at the front instead.
  const shownIndex = hover !== null ? hover % N : touch ? focus : null;
  const shown = shownIndex === null ? null : PROJECTS[shownIndex];

  return (
    <>
      <div className="scene" aria-label="Projects">
        <div className="world" ref={world} style={INITIAL_WORLD}>
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
        {shown && (
          <>
            <p className="caption-name">{shown.name}</p>
            <p className="caption-blurb">
              {shown.year} &middot; {shown.blurb}
            </p>
          </>
        )}
      </div>
    </>
  );
}

function CardFace({ project: p }: { project: Project }) {
  return (
    <div className="card-face" style={{ "--tone": p.tone } as CSSProperties}>
      {p.art.kind === "shot" ? (
        <Image
          className="card-shot"
          src={p.art.src}
          alt=""
          sizes="(max-width: 640px) 60vw, 30vw"
          loading="eager"
          draggable={false}
        />
      ) : (
        <div className="card-logo">
          <Image className="card-logo-mark" src={p.art.src} alt="" draggable={false} loading="eager" />
          <span className="card-logo-tag">{p.art.tagline}</span>
        </div>
      )}
      <span className="card-name">{p.name}</span>
    </div>
  );
}
