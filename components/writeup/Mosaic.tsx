"use client";

/**
 * A wall of builds. Each tile shows what the image model imagined, and turns
 * over to the brick-built model, one tile after another; hover to turn one yourself.
 */

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { useInView } from "@/components/diagram/usePlayback";

export type MosaicItem = { idea: string; concept: StaticImageData; built: StaticImageData };

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
        <div key={it.idea} className="wu-tile" data-turned={i === turned} tabIndex={0}>
          <div className="wu-tile-card">
            <Image className="wu-tile-face" src={it.concept} alt={`${it.idea}, imagined`} sizes="200px" />
            <Image className="wu-tile-back" src={it.built} alt={`${it.idea}, built from bricks`} sizes="200px" />
          </div>
          <span className="wu-tile-idea">“{it.idea}”</span>
        </div>
      ))}
    </div>
  );
}
