/**
 * The whoosh a card makes as it swaps into the spot (public/sounds/whoop.mp3).
 *
 * Browsers only let a page make sound after the visitor has clicked, tapped or
 * pressed a key, so the audio is set up on the first of those. Until then
 * (say, someone who has only scrolled) swipes are silent.
 */

const SRC = "/sounds/whoop.mp3";
/** the file opens with a little silence; skip it so the sound lands with the card */
const START = 0.035;
const VOLUME = 0.9;
/** at most one whoosh this often, so a fast scroll through many cards doesn't buzz */
const MIN_GAP_MS = 70;

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let last = 0;

/** Set up the audio. Call from a click, tap or key press. */
export function unlockSound() {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  ctx = new AudioContext();
  const c = ctx;
  fetch(SRC)
    .then((r) => r.arrayBuffer())
    .then((data) => c.decodeAudioData(data))
    .then((b) => {
      buffer = b;
    })
    .catch(() => {
      // no sound is fine
    });
}

/** Play the whoosh, a touch higher or lower each time so repeats don't sound canned. */
export function playWhoop() {
  if (!ctx || !buffer || ctx.state !== "running") return;
  const now = performance.now();
  if (now - last < MIN_GAP_MS) return;
  last = now;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = 0.95 + Math.random() * 0.1;
  const gain = ctx.createGain();
  gain.gain.value = VOLUME;
  src.connect(gain).connect(ctx.destination);
  src.start(0, START);
}
