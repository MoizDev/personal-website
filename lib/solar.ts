/**
 * The look of the solar system in the background (components/SolarSystem).
 * Size and place are shared by both themes; colour, contrast and weight are
 * set for each theme on its own.
 */

export type ThemeLook = {
  /** 1 paints each body in its own colour; 0 paints greys */
  colour: number;
  /** saturation, times (colour only) */
  vivid: number;
  /** lighten (+) or darken (-) every colour or grey */
  lightness: number;
  /** spread of the shading around its middle: over 1 is punchier */
  contrast: number;
  /** greys only: 1 makes dense glyphs dark and sparse ones light, 0 the reverse */
  invert: number;
  /** font weight of the glyphs */
  weight: number;
  /** opacity of the Sun and planets */
  bodies: number;
  /** opacity of the orbit lines and the asteroid belt */
  orbits: number;
  /** opacity of the stars */
  stars: number;
  /** opacity of the Sun's halo */
  glow: number;
  /** strength of the sky-blue wash in the top right (0 is none) */
  sky: number;
  /** hue of the sky wash, in degrees */
  skyHue: number;
};

const defaults = {
  shared: {
    /** overall scale: 1 makes Saturn's orbit about 0.9 of the page width */
    size: 1.28,
    /** where the Sun sits, as a fraction of the design frame's width and height (lib/scale.ts) */
    x: 0.74,
    y: 0.22,
    /** how far we look down onto the orbits (0 edge on, 1 from straight above) */
    tilt: 0.36,
    /** the character cell, in px */
    cell: 6,
    /** planet sizes, times */
    planets: 1,
    /** Sun size, times */
    sun: 1,
    /** speed of everything, times */
    speed: 0.7,
    /** the drawing fades in from the left so it stays clear of the text: from here (% of the design frame's width, invisible) ... */
    fadeFrom: 0,
    /** ... to here (fully shown) */
    fadeTo: 52,
  },
  light: {
    colour: 0,
    vivid: 1,
    lightness: -1,
    contrast: 1,
    invert: 1,
    weight: 900,
    bodies: 1,
    orbits: 2.84,
    stars: 1.88,
    glow: 1.42,
    sky: 0.38,
    skyHue: 203,
  } satisfies ThemeLook,
  dark: {
    colour: 1,
    vivid: 1,
    lightness: 0,
    contrast: 1,
    invert: 1,
    weight: 400,
    bodies: 0.9,
    orbits: 1.2,
    stars: 0.9,
    glow: 0.9,
    sky: 0,
    skyHue: 210,
  } satisfies ThemeLook,
};

export type SolarShared = typeof defaults.shared;
export type SolarTheme = "light" | "dark";
export type Solar = { shared: SolarShared; light: ThemeLook; dark: ThemeLook };

const clone = (s: Solar): Solar => ({ shared: { ...s.shared }, light: { ...s.light }, dark: { ...s.dark } });

export const SOLAR_DEFAULTS: Readonly<Solar> = Object.freeze(clone(defaults));

/** The live values. The dev panel writes here, then fires SOLAR_EVENT. */
export const SOLAR: Solar = clone(defaults);

/** Fired on window when SOLAR changes, so a paused drawing can repaint. */
export const SOLAR_EVENT = "solar-tune";
