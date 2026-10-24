/** How the row moves. */
const defaults = {
  /** spring frequency of the row (rad/s); lower glides longer */
  glide: 10.8,
  /** cards per wheel pixel */
  wheel: 0.0026,
  /** cards per dragged pixel */
  drag: 0.007,
  /** how far the ground pitches per card/s of speed (degrees) */
  pitchPerSpeed: 0.8,
  /** the most the ground pitches (degrees) */
  maxPitch: 4.5,
  /** spring frequency of the pitch (rad/s) */
  pitchFreq: 4,
  /** 1 settles without swinging past rest; under 1 overshoots a little */
  pitchDamping: 1,
};

export type MotionKey = keyof typeof defaults;

export const MOTION_DEFAULTS: Readonly<Record<MotionKey, number>> = Object.freeze(defaults);

/** The live values. The dev panel writes here; MOTION_DEFAULTS stays as shipped. */
export const MOTION: Record<MotionKey, number> = { ...defaults };
