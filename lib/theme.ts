/**
 * Flip between light and dark, and remember the choice (read back by the
 * script in app/layout.tsx).
 *
 * The switch is one crossfade of the whole page (a view transition), with the
 * page's own transitions held off while it swaps (data-theme-switching, see
 * globals.css). Otherwise each part changes at its own pace: dozens of cards
 * easing their colour over 300ms, each repainted every frame of it, while the
 * rest snaps, and the sky, drawn in a worker, a frame or two behind.
 */
export function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("theme", next);
  } catch {
    // storage blocked; the choice lasts until reload
  }

  const swap = () => {
    root.dataset.theme = next;
  };
  root.setAttribute("data-theme-switching", "");
  const done = () => root.removeAttribute("data-theme-switching");

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!still && typeof document.startViewTransition === "function") {
    const vt = document.startViewTransition(swap);
    vt.finished.then(done, done);
  } else {
    swap();
    // held off for the frame the new theme first paints in
    requestAnimationFrame(() => requestAnimationFrame(done));
  }
}
