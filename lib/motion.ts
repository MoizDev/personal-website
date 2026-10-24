/**
 * How the row moves. A plain object rather than constants so the dev panel can
 * tune it while the page runs; nothing else writes to it.
 */
export const MOTION = {
  /** spring frequency of the row (rad/s); lower glides longer */
  glide: 4.2,
  /** cards per wheel pixel */
  wheel: 0.0026,
  /** cards per dragged pixel */
  drag: 0.007,
  /** how far the ground pitches per card/s of speed (degrees) */
  pitchPerSpeed: 0.75,
  /** the most the ground pitches (degrees) */
  maxPitch: 4.5,
  /** spring frequency of the pitch (rad/s) */
  pitchFreq: 4,
  /** under 1, so the ground swings back a touch past rest */
  pitchDamping: 0.5,
};

export type MotionKey = keyof typeof MOTION;
