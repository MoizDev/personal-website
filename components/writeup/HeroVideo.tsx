"use client";

import type { StaticImageData } from "next/image";
import { useReducedMotion } from "@/components/diagram/usePlayback";

/**
 * A hero clip: muted, looping and inline, so it plays like a moving picture.
 * With reduced motion it holds on its poster and offers controls instead.
 */
export function HeroVideo({ poster, alt, mp4, webm }: { poster: StaticImageData; alt: string; mp4: string; webm?: string }) {
  const reduced = useReducedMotion();
  return (
    <video
      key={reduced ? "still" : "playing"}
      poster={poster.src}
      width={poster.width}
      height={poster.height}
      aria-label={alt}
      autoPlay={!reduced}
      controls={reduced}
      muted
      loop
      playsInline
      preload={reduced ? "none" : "auto"}
    >
      {webm && <source src={webm} type="video/webm" />}
      <source src={mp4} type="video/mp4" />
    </video>
  );
}
