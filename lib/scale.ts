/**
 * The desktop layout is designed on a 1710 x 958 screen and scales as one
 * piece to fit any other, so zooming (cmd +/-) or a different screen doesn't
 * rearrange it. CSS does this with --u (app/globals.css): one pixel of the
 * design, scaled. Phones (a screen taller than wide) use plain pixels.
 *
 * Keep these in step with --u and the phone media query in app/globals.css.
 */

export const DESIGN_W = 1710;
export const DESIGN_H = 958;
export const PHONE_QUERY = "(max-aspect-ratio: 3/4)";

/** How many CSS pixels one design pixel is right now (the value of --u). */
export function designPx() {
  if (matchMedia(PHONE_QUERY).matches) return 1;
  return Math.min(innerWidth / DESIGN_W, innerHeight / DESIGN_H);
}
