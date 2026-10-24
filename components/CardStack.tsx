"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { MOTION } from "@/lib/motion";
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
 * view). Card n sits in slot s = n - p: s >= 0 is in the row, s in [-1, 0) is
 * flying to the spot, s in [-2, -1) is leaving it.
 */

const N = PROJECTS.length;
const LOOPS = 7;
/** card elements in the loop; the projects come round LOOPS times */
const M = N * LOOPS;
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
const STAGGER_MS = 55; // between one card starting to fall and the next
const STAGGER_CAP = 14; // cards further back than this all fall with the last one (they're in the haze)
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

/** Where the spot is, measured from the page: px from the front card's foot to the spot's bottom centre. */
type Spot = { dx: number; dy: number; scale: number; lift: number; yaw: number };

/** `drop` lifts the card off the ground, in card widths. */
const rowTransform = (s: number, drop = 0) =>
  `translate3d(calc(var(--card-w) * var(--gap) * ${s.toFixed(4)}), calc(var(--card-w) * ${(-drop).toFixed(4)}), 0) rotateY(-90deg)`;

/**
 * The world turns the row by (pitch, yaw). To face the camera a card undoes
 * that turn, then moves to the spot. `t` runs 0 (front of the row) to 1 (in the spot).
 */
function flightTransform(t: number, spot: Spot, pitch: number, up = 0) {
  const e = smooth(t);
  const scale = 1 + (spot.scale - 1) * e;
  return (
    `rotateY(${(-spot.yaw * e).toFixed(3)}deg) rotateX(${(-pitch * e).toFixed(3)}deg) ` +
    `translate3d(${(spot.dx * e).toFixed(2)}px, ${(spot.dy * e - up).toFixed(2)}px, 0) ` +
    `scale(${scale.toFixed(4)}) rotateY(${(-90 * (1 - e)).toFixed(3)}deg)`
  );
}

function cardPose(s: number, n: number, spot: Spot | null, pitch: number) {
  if (n < 0) return { transform: rowTransform(s), opacity: 0 }; // before the first project
  if (s >= 0) return { transform: rowTransform(s), opacity: clamp((M - OUT - s) / FOG, 0, 1) };
  if (!spot) return { transform: rowTransform(s), opacity: 0 };
  if (s >= -1) return { transform: flightTransform(-s, spot, pitch), opacity: 1 };
  // leaving: drift up out of the spot and fade
  const e = -1 - s;
  const opacity = 1 - smooth(clamp(e / 0.7, 0, 1));
  return { transform: flightTransform(1, spot, pitch, spot.lift * smooth(e)), opacity };
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
  const delay = Math.min(slotOf(j, 0), STAGGER_CAP) * STAGGER_MS;
  const t = clamp((ms - delay) / DROP_MS, 0, 1);
  return { drop: DROP * (1 - easeOut(t)), fade: clamp(t * 2.5, 0, 1) };
}
const INITIAL_WORLD: CSSProperties = { transform: worldTransform(0) };
const HIDDEN: CSSProperties = { opacity: 0, visibility: "hidden" };

export function CardStack() {
  const world = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
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
    const introEnd = reduce ? introStart : introStart + STAGGER_CAP * STAGGER_MS + DROP_MS;
    let flipTimer = 0;
    let raf = 0;
    let snapTimer = 0;
    let shown = -2;
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
      spot = {
        dx: r.left + r.width / 2 - o.left,
        dy: r.bottom - o.top,
        scale: r.width / w,
        lift: r.height * 0.1,
        yaw: parseFloat(root.getPropertyValue("--yaw")) || 0,
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
        el.style.opacity = pose.opacity.toFixed(3);
        el.style.visibility = pose.opacity < 0.01 ? "hidden" : "";
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
        if (atRest()) rowBox = boxRow();
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

    function aim(target: number) {
      m.target = clamp(target, 0, N); // from the opening view to the last project
      kick();
    }

    /** The last project is out and settled: further on, the page scrolls to the footer. */
    const atEnd = () => m.target >= N && Math.abs(m.cur - N) < 0.05;
    const scrolled = () => window.scrollY > 0;

    function push(by: number) {
      setHover(null); // the card under the pointer is about to slide away
      aim(clamp(m.target + by, m.cur - MAX_LEAD, m.cur + MAX_LEAD));
    }

    function settleSoon() {
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => aim(Math.round(m.target)), SNAP_DELAY);
    }

    // Pull card j out into the spot.
    goTo.current = (j: number) => {
      setHover(null);
      aim(Math.round(m.cur + slotOf(j, m.cur)) + 1);
    };

    // The row's box on the page: round the cards standing in it, padded a little.
    // Taken with the row at rest, where it's the same whichever card is in front,
    // so it doesn't shrink and shift while cards move. In page coordinates, so
    // scrolling doesn't stale it.
    let rowBox: { l: number; t: number; r: number; b: number } | null = null;
    function boxRow() {
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      for (let j = 0; j < M; j++) {
        const el = cards.current[j];
        if (!el || slots.current[j] < 0 || el.style.visibility === "hidden") continue;
        const box = el.getBoundingClientRect();
        l = Math.min(l, box.left);
        t = Math.min(t, box.top);
        r = Math.max(r, box.right);
        b = Math.max(b, box.bottom);
      }
      const pad = 24;
      return { l: l - pad, t: t + window.scrollY - pad, r: r + pad, b: b + window.scrollY + pad };
    }
    const atRest = () => m.cur === Math.round(m.cur) && performance.now() >= introEnd;
    function overRow(x: number, y: number) {
      const box = rowBox ?? boxRow();
      const py = y + window.scrollY;
      return x >= box.l && x <= box.r && py >= box.t && py <= box.b;
    }

    // Each wheel gesture goes wholly to the row or wholly to the page, decided as it
    // starts: the row if the pointer is over it, else the page. So the page scrolling
    // under the pointer never steals a gesture, and the row never strands one.
    // Past the last project, a new gesture onward goes to the page.
    let lastWheel = -Infinity;
    let wheelGoes: "row" | "page" = "page";
    const PAUSE = 200; // ms of quiet that ends a gesture (trackpad momentum included)

    function onWheel(e: WheelEvent) {
      if (e.ctrlKey) return; // pinch zoom
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.timeStamp - lastWheel > PAUSE) {
        wheelGoes = overRow(e.clientX, e.clientY) && !(d > 0 && atEnd()) ? "row" : "page";
      }
      lastWheel = e.timeStamp;
      if (wheelGoes === "page") return; // the browser scrolls
      e.preventDefault();
      push(d * unit * MOTION.wheel);
      settleSoon();
    }

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (scrolled() && e.key !== "Home") return; // the page has the keys while it's scrolled
      if (e.key === "Home" || e.key === "Escape") {
        e.preventDefault();
        if (e.key === "Home") window.scrollTo({ top: 0, behavior: "smooth" });
        setHover(null);
        aim(0);
        return;
      }
      const forward = ["ArrowDown", "ArrowRight", "PageDown", "j"];
      const back = ["ArrowUp", "ArrowLeft", "PageUp", "k"];
      let step = forward.includes(e.key) ? 1 : back.includes(e.key) ? -1 : 0;
      if (e.key === " ") step = e.shiftKey ? -1 : 1;
      if (!step) return;
      if (step > 0 && m.target >= N) return; // past the last project: the page scrolls on
      e.preventDefault();
      setHover(null);
      aim(Math.round(m.target) + step);
    }

    // Dragging (touch or mouse) moves the row too, and a flick carries on.
    // Past the last project (or with the page scrolled) a drag scrolls the page instead.
    let drag: { x: number; y: number; t: number; v: number; moved: number; page: boolean } | null = null;
    let swallowClick = false;

    function onDown(e: PointerEvent) {
      if (e.button !== 0) return;
      if (!(e.target as Element | null)?.closest(".home")) return; // the footer is the page's own
      drag = { x: e.clientX, y: e.clientY, t: e.timeStamp, v: 0, moved: 0, page: false };
      swallowClick = false;
      clearTimeout(snapTimer);
    }

    function onMove(e: PointerEvent) {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      const d = -(Math.abs(dy) >= Math.abs(dx) ? dy : dx) * MOTION.drag;
      const dt = Math.max((e.timeStamp - drag.t) / 1000, 1 / 240);
      drag.v = drag.v * 0.6 + (d / dt) * 0.4;
      drag.moved += Math.hypot(dx, dy);
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.t = e.timeStamp;
      if (drag.moved <= 6) return;
      if (scrolled() || (d > 0 && atEnd())) {
        drag.page = true;
        window.scrollBy(0, -(Math.abs(dy) >= Math.abs(dx) ? dy : dx));
        return;
      }
      push(d);
    }

    function onUp() {
      if (!drag) return;
      if (drag.moved > 6) {
        swallowClick = true;
        if (!drag.page) push(clamp(drag.v * 0.25, -MAX_LEAD, MAX_LEAD));
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
      rowBox = atRest() ? boxRow() : null;
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
    flipTimer = window.setTimeout(() => m.target === 0 && aim(1), reduce ? 0 : FLIP_AT_MS);

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
  const activeEl = active >= 0 ? active % M : -1;
  const hovered = hover !== null ? PROJECTS[hover % N] : null;

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
                onClick={(e) => onCardClick(e, j)}
                onPointerEnter={(e) => e.pointerType === "mouse" && slots.current[j] >= 0 && setHover(j)}
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

      <div className="caption" aria-live="polite">
        {hovered && (
          <>
            <p className="caption-name">{hovered.name}</p>
            <p className="caption-blurb">
              {hovered.year} &middot; {hovered.blurb}
            </p>
          </>
        )}
      </div>
    </>
  );
}

/** "https://github.com/MoizDev/wat-wiki" -> "github.com/MoizDev/wat-wiki" */
function linkLabel(href: string) {
  const u = new URL(href);
  return (u.host.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
}

function CardFace({ project: p, live }: { project: Project; live: boolean }) {
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
      {live && p.video && (
        <video className="card-shot card-video" src={p.video} autoPlay muted loop playsInline aria-hidden />
      )}
      <span className="card-name">{p.name}</span>
    </div>
  );
}
