"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { MOTION } from "@/lib/motion";
import { designPx, PHONE_QUERY } from "@/lib/scale";
import { playWhoop, unlockSound } from "@/lib/sound";
import { CardLines } from "@/components/CardLines";
import { PROJECTS, type Project } from "@/lib/projects";

/*
 * A row of square cards standing on a ground plane, running off into the
 * distance. Scrolling pulls the front card out of the row: it turns to face
 * you and settles, bigger, in the spot on the left with its write-up below.
 * The next scroll sends it away and pulls out the next one.
 *
 *   X  runs along the row. Cards in the row only ever slide along X.
 *   Z  points up out of the ground. Hovering lifts a card along Z.
 *   The ground pitches with speed: faster flattens it, stopping springs it back.
 *
 * In CSS terms the ground is the x/z plane of `.world`, "up" is -y, and the
 * camera angle is the world's rotateX (pitch) and rotateY (yaw).
 *
 * Position `p` counts cards pulled out. At p = 0 nothing is out (the opening
 * view, which on desktop only shows during the load before the first card flips out). Card n sits in slot s = n - p: s >= 0 is in the row, s in [-1, 0) is
 * flying to the spot, s in [-2, -1) is leaving it.
 */

const N = PROJECTS.length;
/** card elements: the projects, then mystery cards running off into the haze */
const M = N * 7;
/** slots behind the front kept for cards flying to and from the spot */
const OUT = 2;
/**
 * The far end, where cards wrap round, sits off the top of the screen at rest.
 * The last FOG slots fade out so a fast scroll (flatter ground) shows a haze, not an end.
 */
const FOG = 10;
// On load the cards drop onto the ground one after another, front first,
// then the front card flips out into the spot.
const DROP = 1.4; // how high a card falls from, in card widths
const DROP_MS = 620; // how long one card takes to land
const STAGGER_MS = 55; // between the front card starting to fall and the next
// each gap after that is this much of the one before, so the wave runs the whole
// row (no card falls in a clump) yet the far end still lands soon after the front
const STAGGER_EASE = 0.95;
/** when the card in a slot starts to fall; it never reaches STAGGER_MS / (1 - STAGGER_EASE) */
const dropDelay = (slot: number) => (STAGGER_MS * (1 - STAGGER_EASE ** slot)) / (1 - STAGGER_EASE);
const DROP_END = STAGGER_MS / (1 - STAGGER_EASE) + DROP_MS; // the last card is down by then
const FLIP_AT_MS = 950; // when the front card flips out into the spot
const easeOut = (t: number) => 1 - (1 - t) ** 3;

// Scroll. Positions are in cards, speeds in cards per second.
// The row chases the scroll target on a critically damped spring, so it eases
// in and out of every move instead of jumping to speed.
// The feel of it lives in MOTION (lib/motion.ts), so the dev panel can tune it live.
const MAX_LEAD = 5; // how far the target may run ahead of the row, in cards
const SNAP_DELAY = 180; // ms of quiet before settling on a card

const wrap = (v: number, m: number) => ((v % m) + m) % m;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Slot of card element j when the row is at p. */
const slotOf = (j: number, p: number) => wrap(j - p + OUT, M) - OUT;

/**
 * Where the spot is, measured from the page: px from the world's origin to the
 * spot's bottom centre. `lead` is how far back the front of the row stands from
 * the origin, in px (--lead: phones stand the row behind the spot).
 */
type Spot = { dx: number; dy: number; scale: number; lift: number; push: number; fade: number; yaw: number; lead: number };

/** `drop` lifts the card off the ground, in card widths. */
const rowTransform = (s: number, drop = 0) =>
  `translate3d(calc(var(--card-w) * var(--gap) * (${s.toFixed(4)} + var(--lead))), calc(var(--card-w) * ${(-drop).toFixed(4)}), 0) rotateY(-90deg)`;

/**
 * The world turns the row by (pitch, yaw). To face the camera a card undoes
 * that turn, then moves to the spot. `t` runs 0 (front of the row) to 1 (in the spot).
 */
function flightTransform(t: number, spot: Spot, pitch: number, up = 0, near = 0) {
  const e = smooth(t);
  const scale = 1 + (spot.scale - 1) * e;
  return (
    `translate3d(${(spot.lead * (1 - e)).toFixed(2)}px, 0, 0) ` +
    `rotateY(${(-spot.yaw * e).toFixed(3)}deg) rotateX(${(-pitch * e).toFixed(3)}deg) ` +
    `translate3d(${(spot.dx * e).toFixed(2)}px, ${(spot.dy * e - up).toFixed(2)}px, ${near.toFixed(2)}px) ` +
    `scale(${scale.toFixed(4)}) rotateY(${(-90 * (1 - e)).toFixed(3)}deg)`
  );
}

function cardPose(s: number, n: number, spot: Spot | null, pitch: number) {
  if (n < 0) return { transform: rowTransform(s), opacity: 0 }; // before the first project
  if (s >= 0) return { transform: rowTransform(s), opacity: clamp((M - OUT - s) / FOG, 0, 1) };
  if (!spot) return { transform: rowTransform(s), opacity: 0 };
  if (s >= -1) return { transform: flightTransform(-s, spot, pitch), opacity: 1 };
  // leaving: drift up and toward the camera out of the spot, and fade. Coming
  // forward keeps it in front of the next card, which turns as it flies in and
  // would otherwise cut through it.
  const e = -1 - s;
  const opacity = 1 - smooth(clamp(e / spot.fade, 0, 1));
  const near = spot.push * smooth(clamp(e * 2, 0, 1));
  return { transform: flightTransform(1, spot, pitch, spot.lift * smooth(e), near), opacity };
}

const worldTransform = (pitch: number) =>
  `translate3d(var(--ox), var(--oy), 0) rotateX(calc(var(--pitch) + ${pitch.toFixed(3)}deg)) rotateY(var(--yaw))`;

// Server render and first paint have every card up in the air, unseen, ready to drop.
// These objects never change, so re-renders leave the per-frame inline styles alone.
const INITIAL: CSSProperties[] = Array.from({ length: M }, (_, j) => ({
  transform: rowTransform(slotOf(j, 0), DROP),
  opacity: 0,
  visibility: "hidden",
}));

/** How far card j still has to fall (card widths) and how faded in it is, `ms` into the load. */
function dropOf(j: number, ms: number) {
  const delay = dropDelay(slotOf(j, 0));
  const t = clamp((ms - delay) / DROP_MS, 0, 1);
  return { drop: DROP * (1 - easeOut(t)), fade: clamp(t * 2.5, 0, 1) };
}
const INITIAL_WORLD: CSSProperties = { transform: worldTransform(0) };
const HIDDEN: CSSProperties = { opacity: 0, visibility: "hidden" };

/**
 * Cards from the spot to this many slots into the row are built in 3D (thickness,
 * parting layers); the rest are flat, which keeps the GPU's layer count
 * down. Further back only a sliver of each card shows past the ones in front.
 */
const DEEP = 4;

export function CardStack() {
  const world = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const slots = useRef<Float64Array>(new Float64Array(M));
  const goTo = useRef<(j: number) => void>(() => {});
  /** the project number in the spot (counting round the loop), or -1 */
  const [active, setActive] = useState(-1);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const m = { cur: 0, target: 0, vel: 0, pitch: 0, pitchVel: 0, last: 0, running: false };
    // the load-in: cards dropping onto the ground (skipped for reduced motion)
    const introStart = performance.now();
    const introEnd = reduce ? introStart : introStart + DROP_END;
    let flipTimer = 0;
    let raf = 0;
    let snapTimer = 0;
    let shown = -2;
    /** the visitor has moved the row (the load's own flip-out makes no sound) */
    let moved = false;
    let spot: Spot | null = null;
    let basePitch = 0;

    // The spot is laid out by CSS; measure it so cards can fly there.
    function measure() {
      // the spot sits below the intro, however tall its text wraps
      const intro = document.querySelector<HTMLElement>(".intro");
      if (intro)
        document.documentElement.style.setProperty("--intro-bottom", `${intro.offsetTop + intro.offsetHeight}px`);
      const root = getComputedStyle(document.documentElement);
      basePitch = parseFloat(root.getPropertyValue("--pitch")) || 0;
      const o = origin.current?.getBoundingClientRect();
      const r = spotRef.current?.getBoundingClientRect();
      const w = cards.current[0]?.offsetWidth;
      if (!o || !r || !w) return;
      const num = (k: string) => parseFloat(root.getPropertyValue(k)) || 0;
      const lead = w * num("--gap") * num("--lead");
      const dx = r.left + r.width / 2 - o.left;
      const dy = r.bottom - o.top;
      spot = {
        dx,
        dy,
        scale: r.width / w,
        lift: r.height * num("--lift"),
        push: r.width * num("--leave-near"),
        fade: num("--leave-fade") || 0.7,
        yaw: parseFloat(root.getPropertyValue("--yaw")) || 0,
        lead,
      };
    }

    function paint(now = performance.now()) {
      const pitch = basePitch + m.pitch;
      const intro = now < introEnd ? now - introStart : -1;
      for (let j = 0; j < M; j++) {
        const el = cards.current[j];
        if (!el) continue;
        const s = slotOf(j, m.cur);
        slots.current[j] = s;
        const pose = cardPose(s, Math.round(m.cur + s), spot, pitch);
        if (intro >= 0 && s >= 0) {
          const d = dropOf(j, intro);
          pose.transform = rowTransform(s, d.drop);
          pose.opacity *= d.fade;
        }
        el.style.transform = pose.transform;
        const hidden = pose.opacity < 0.01;
        el.style.visibility = hidden ? "hidden" : "";
        // The row is a loop, so projects already pulled out come back round at the far
        // end. There they're plain grey like the mystery cards, and can't be clicked.
        const ghost = j < N && Math.round(m.cur + s) >= M;
        if (ghost !== el.hasAttribute("data-ghost")) {
          el.toggleAttribute("data-ghost", ghost);
          el.inert = ghost;
        }
        const deep = s >= -OUT && s < DEEP;
        if (deep !== el.hasAttribute("data-deep")) el.toggleAttribute("data-deep", deep);
        // A 3D card fades layer by layer: opacity on the card itself would flatten it.
        const fade = pose.opacity.toFixed(3);
        el.style.opacity = deep ? "" : fade;
        el.style.setProperty("--fade", deep ? fade : "1");
      }
      if (world.current) world.current.style.transform = worldTransform(m.pitch);

      // The write-up fades out as its card leaves and in as the next one lands.
      const k = Math.round(m.cur);
      const n = k - 1;
      const settle = n >= 0 ? clamp(1 - Math.abs(m.cur - k) * 3.2, 0, 1) : 0;
      if (detail.current) {
        detail.current.style.opacity = settle.toFixed(3);
        detail.current.style.transform = `translateY(${((1 - settle) * 10).toFixed(2)}px)`;
        detail.current.style.visibility = settle < 0.01 ? "hidden" : "";
      }
      if (n !== shown) {
        if (moved) playWhoop();
        shown = n;
        setActive(n);
        // lets the page make room for a pulled-out card (phones hide the intro)
        document.documentElement.toggleAttribute("data-out", n >= 0);
      }
    }

    function tick(now: number) {
      const dt = Math.min((now - m.last) / 1000, 1 / 30);
      m.last = now;
      if (dt <= 0) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const glide = reduce ? 16 : MOTION.glide;
      m.vel += (glide * glide * (m.target - m.cur) - 2 * glide * m.vel) * dt;
      m.cur += m.vel * dt;
      if (Math.abs(m.target - m.cur) < 5e-4 && Math.abs(m.vel) < 5e-3) {
        m.cur = m.target;
        m.vel = 0;
      }

      const want = reduce ? 0 : clamp(m.vel * MOTION.pitchPerSpeed, -MOTION.maxPitch, MOTION.maxPitch);
      const f = MOTION.pitchFreq;
      m.pitchVel += (f * f * (want - m.pitch) - 2 * MOTION.pitchDamping * f * m.pitchVel) * dt;
      m.pitch += m.pitchVel * dt;

      paint(now);
      const still =
        now >= introEnd && m.cur === m.target && Math.abs(m.pitch) < 0.01 && Math.abs(m.pitchVel) < 0.01;
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

    /**
     * The first position the row can rest at. On desktop a card is always in
     * the spot, so it's 1 (the opening view, 0, is only passed through on load).
     * Phones show the intro where a card's write-up goes, so they open on 0
     * (the deck, with nothing pulled out yet) and can come back to it.
     */
    const first = () => (matchMedia(PHONE_QUERY).matches ? 0 : 1);

    function aim(target: number) {
      m.target = clamp(target, first(), N); // up to the last project
      kick();
    }

    // A scroll or drag settles on a card when it stops. Any deliberate nudge from
    // where it started (NUDGE of a card) goes at least one card that way, so a
    // gentle swipe moves on instead of springing back.
    const NUDGE = 0.08;
    let anchor: number | null = null; // the card the scroll or drag started from

    function push(by: number) {
      moved = true;
      setHover(null); // the card under the pointer is about to slide away
      anchor ??= Math.round(m.target);
      aim(clamp(m.target + by, m.cur - MAX_LEAD, m.cur + MAX_LEAD));
    }

    function settle() {
      const from = anchor ?? Math.round(m.target);
      const off = m.target - from;
      anchor = null;
      aim(Math.abs(off) < NUDGE ? from : from + Math.sign(off) * Math.max(1, Math.round(Math.abs(off))));
    }

    /** Go straight to a card (keys, clicks), dropping any scroll in progress. */
    function jump(target: number) {
      moved = true;
      clearTimeout(snapTimer);
      anchor = null;
      aim(target);
    }

    function settleSoon() {
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(settle, SNAP_DELAY);
    }

    // Pull card j out into the spot.
    goTo.current = (j: number) => {
      setHover(null);
      jump(Math.round(m.cur + slotOf(j, m.cur)) + 1);
    };

    function onWheel(e: WheelEvent) {
      if (e.ctrlKey) return; // pinch zoom
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      e.preventDefault();
      push(d * unit * MOTION.wheel);
      settleSoon();
    }

    function onKey(e: KeyboardEvent) {
      unlockSound();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Home" || e.key === "Escape") {
        e.preventDefault();
        setHover(null);
        jump(first());
        return;
      }
      const forward = ["ArrowDown", "ArrowRight", "PageDown", "j"];
      const back = ["ArrowUp", "ArrowLeft", "PageUp", "k"];
      let step = forward.includes(e.key) ? 1 : back.includes(e.key) ? -1 : 0;
      if (e.key === " ") step = e.shiftKey ? -1 : 1;
      if (!step) return;
      e.preventDefault();
      setHover(null);
      jump(Math.round(m.target) + step);
    }

    // Dragging (touch or mouse) moves the row too, and a flick carries on.
    let drag: { x: number; y: number; t: number; v: number; moved: number } | null = null;
    let swallowClick = false;

    function onDown(e: PointerEvent) {
      unlockSound();
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, t: e.timeStamp, v: 0, moved: 0 };
      swallowClick = false;
      clearTimeout(snapTimer);
    }

    function onMove(e: PointerEvent) {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      // in design pixels, so the row keeps pace with the pointer at any size or zoom
      const d = (-(Math.abs(dy) >= Math.abs(dx) ? dy : dx) / designPx()) * MOTION.drag;
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

    function onClick(e: globalThis.MouseEvent) {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    }

    function onResize() {
      measure();
      paint();
    }

    measure();
    const introSize = new ResizeObserver(onResize);
    const introEl = document.querySelector(".intro");
    if (introEl) introSize.observe(introEl);
    window.addEventListener("resize", onResize);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("click", onClick, true);
    kick();
    // once the front cards have landed, the first one flips out (unless the visitor already moved)
    if (first() === 1) flipTimer = window.setTimeout(() => m.target < 1 && aim(1), reduce ? 0 : FLIP_AT_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(snapTimer);
      clearTimeout(flipTimer);
      introSize.disconnect();
      document.documentElement.style.removeProperty("--intro-bottom");
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("click", onClick, true);
      document.documentElement.removeAttribute("data-out");
    };
  }, []);

  const activeProject = active >= 0 ? PROJECTS[active % N] : null;

  // the navbar's menu button takes the colour of the project in the spot
  useEffect(() => {
    const root = document.documentElement.style;
    if (activeProject) {
      root.setProperty("--project-tone", activeProject.tone);
      root.setProperty("--project-tone-ink", "#fff");
    } else {
      root.removeProperty("--project-tone");
      root.removeProperty("--project-tone-ink");
    }
  }, [activeProject]);
  const activeEl = active >= 0 ? active % M : -1;

  // A hovered card leans toward the pointer: where it is over the card, from -1 to 1 each way.
  function tilt(e: ReactPointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1).toFixed(3));
    el.style.setProperty("--py", clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1).toFixed(3));
  }

  // A card in the row comes out when clicked; the card in the spot opens the project.
  function onCardClick(e: MouseEvent, j: number) {
    if (j === activeEl && slots.current[j] < 0) return;
    e.preventDefault();
    goTo.current(j);
  }

  return (
    <>
      <div className="scene" aria-label="Projects">
        <div className="world" ref={world} style={INITIAL_WORLD}>
          <div className="world-origin" ref={origin} />
          {Array.from({ length: M }, (_, j) => {
            // past the last project: what's next
            if (j >= N)
              return (
                <div
                  key={j}
                  ref={(el) => {
                    cards.current[j] = el;
                  }}
                  className="card"
                  aria-hidden
                  style={INITIAL[j]}
                >
                  <MysteryFace j={j} front={j === N && active === N - 1} />
                </div>
              );
            const p = PROJECTS[j];
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
                style={INITIAL[j]}
                onClick={(e) => onCardClick(e, j)}
                onPointerEnter={(e) => e.pointerType === "mouse" && slots.current[j] >= 0 && setHover(j)}
                onPointerMove={tilt}
                onPointerLeave={() => setHover((h) => (h === j ? null : h))}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && goTo.current(j)}
              >
                <CardFace project={p} live={j === activeEl} />
              </a>
            );
          })}
        </div>
      </div>

      {/* where a pulled-out card lands; laid out by CSS, measured by the effect */}
      <div className="spot" ref={spotRef} aria-hidden />

      <div className="detail" ref={detail} style={HIDDEN} aria-live="polite">
        {activeProject && (
          <>
            <p className="detail-head">
              <span className="detail-name">{activeProject.name}</span>
              <span className="detail-meta">
                {activeProject.kind} &middot; {activeProject.year}
              </span>
            </p>
            <p className="detail-about">{activeProject.about}</p>
            <a className="detail-link" href={activeProject.href} target="_blank" rel="noreferrer">
              {linkLabel(activeProject.href)} <span aria-hidden>&#8599;</span>
            </a>
          </>
        )}
      </div>

    </>
  );
}

/** Just the site: "https://github.com/MoizDev/wat-wiki" -> "github.com" */
function linkLabel(href: string) {
  return new URL(href).host.replace(/^www\./, "");
}

/** Shades of grey for the mystery cards, as a share of the text colour over the page. */
const GREYS = [16, 24, 12, 30, 20, 26, 14, 22];
const GLYPHS = "#%&@$*!/<>{}[]=+~^ABCDEFGHJKMNPRSTXYZ0123456789";
const SCRAMBLE_FRAMES = 11; // characters shown before landing on ?
const SCRAMBLE_FRAME_MS = 36; // how long each one shows (11 x 36ms: lands in about 0.4s)

/**
 * A grey card with a question mark. The first one, once it's at the front of
 * the row (the last project is out), scrambles through random characters as it
 * arrives and settles on the question mark.
 */
function MysteryFace({ j, front }: { j: number; front: boolean }) {
  const mark = useRef<HTMLSpanElement>(null);
  const tone = `color-mix(in srgb, var(--fg) ${GREYS[j % GREYS.length]}%, var(--bg))`;

  useEffect(() => {
    const el = mark.current;
    if (!el || !front || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const scramble = (frames: number) => {
      if (frames <= 0) {
        el.textContent = "?";
        return;
      }
      el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      timer = window.setTimeout(() => scramble(frames - 1), SCRAMBLE_FRAME_MS);
    };
    // straight away, so it arrives scrambling rather than showing the ? first
    scramble(SCRAMBLE_FRAMES);
    return () => {
      clearTimeout(timer);
      el.textContent = "?";
    };
  }, [front]);

  return (
    <Body tone={tone}>
      <span className="card-mystery" ref={mark}>
        ?
      </span>
    </Body>
  );
}

function CardFace({ project: p, live }: { project: Project; live: boolean }) {
  return (
    <Body
      tone={p.tone}
      outside={
        p.badge && (
          <span className="card-badge" data-live={live}>
            <span className="card-badge-title">{p.badge.title}</span>
            <span className="card-badge-detail">{p.badge.detail}</span>
          </span>
        )
      }
    >
      <CardLines art={p.lines} />
      {p.art.kind === "shot" ? (
        <Image
          className="card-shot"
          src={p.art.src}
          alt=""
          sizes="(max-aspect-ratio: 3/4) 60vw, 30vw"
          loading="eager"
          draggable={false}
        />
      ) : (
        <div className="card-logo">
          <Image className="card-logo-mark" src={p.art.src} alt="" draggable={false} loading="eager" />
          <span className="card-logo-tag">{p.art.tagline}</span>
        </div>
      )}
      {live && p.video && (
        <video className="card-shot card-video" src={p.video} autoPlay muted loop playsInline aria-hidden />
      )}
      <span className="card-name">
        <Image className="card-name-logo" src={p.logo} alt="" draggable={false} loading="eager" />
        {p.name}
      </span>
    </Body>
  );
}

/**
 * A card: one flat layer holding what's printed on it and the gloss, plus
 * anything that sticks out past its edge (`outside`, not clipped by the plate). (Printed
 * layers as separate 3D planes sit too close together for the browser to sort,
 * so they cut through each other; the hover parallax slides them within the
 * face instead.)
 */
function Body({ tone, children, outside }: { tone: string; children: ReactNode; outside?: ReactNode }) {
  return (
    <div className="card-face" style={{ "--tone": tone } as CSSProperties}>
      <div className="card-front">
        {children}
      </div>
      {outside}
    </div>
  );
}
