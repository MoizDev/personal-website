"use client";

/**
 * A wall of tiles. Each tile shows one image and turns over to a second, one
 * tile after another: a sketch and its result, an input and its output. Hover
 * or focus a tile to turn it yourself. Holds still for reduced motion.
 */

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { useInView } from "../diagram/usePlayback";

export type MosaicItem = {
  /** the caption under the tile */
  label: string;
  front: StaticImageData;
  back: StaticImageData;
  frontAlt?: string;
  backAlt?: string;
};

export function Mosaic({ items }: { items: MosaicItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { inView, reduced } = useInView(ref);
  const [turned, setTurned] = useState(-1);

  useEffect(() => {
    if (!inView || reduced) return;
    const t = setInterval(() => setTurned((n) => (n + 1) % items.length), 1100);
    return () => clearInterval(t);
  }, [inView, reduced, items.length]);

  return (
    <div ref={ref} className="wu-mosaic">
      {items.map((it, i) => (
        <div key={it.label} className="wu-tile" data-turned={i === turned} tabIndex={0}>
          <div className="wu-tile-card">
            <Image className="wu-tile-face" src={it.front} alt={it.frontAlt ?? `${it.label}, before`} sizes="200px" />
            <Image className="wu-tile-back" src={it.back} alt={it.backAlt ?? `${it.label}, after`} sizes="200px" />
          </div>
          <span className="wu-tile-idea">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
