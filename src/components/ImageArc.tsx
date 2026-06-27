"use client";

// A shallow, wide "smile" arc of clean rounded-square tiles that slowly orbit.
// A very large radius keeps the curve gentle (not a semicircle). Tiles are NOT
// edge-faded — instead the whole section is masked at the left/right so tiles
// dissolve into fog as they slide off the sides of the screen.
const N = 44; // tiles around the full circle (only the bottom slice is visible)
const R = 1700; // very large radius => shallow, flat curve
const CY = -1560; // circle center, far above the band
const TILE = 116;
const H = 220; // visible band height (kept short so it fits a laptop screen)

// Fade every edge of the band so tiles dissolve into fog instead of being
// hard-clipped at the section boundary (which showed a straight seam).
const FOG =
  "linear-gradient(to right, transparent 0%, #000 18%, #000 82%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 12%, #000 92%, transparent 100%)";

export function ImageArc({ images }: { images: string[] }) {
  if (!images?.length) return null;
  const tiles = Array.from({ length: N }, (_, i) => images[i % images.length]);

  return (
    <section
      aria-hidden
      className="relative mt-2 w-full overflow-hidden"
      style={{
        height: H,
        // fog on all edges — tiles dissolve as they slide off, no hard seam
        WebkitMaskImage: FOG,
        WebkitMaskComposite: "source-in",
        maskImage: FOG,
        maskComposite: "intersect",
      }}
    >
      <div className="arc-spin absolute" style={{ left: "50%", top: CY }}>
        {tiles.map((src, i) => {
          const angle = (360 / N) * i;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                width: TILE,
                height: TILE,
                marginLeft: -TILE / 2,
                marginTop: -TILE / 2,
                transform: `rotate(${angle}deg) translateY(${R}px)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full rounded-[20px] object-cover shadow-sm"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
