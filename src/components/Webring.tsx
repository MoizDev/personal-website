import { RING } from "@/lib/webring";

/**
 * UW CS webring badge. Two things here are load-bearing and shouldn't be refactored away:
 *
 * - `data-webring` on the wrapper is what the ring's bot greps for in the server-rendered
 *   HTML, so this stays a server component and the attribute stays on an element that
 *   always renders.
 * - prev/next point at the ring's hop.html, not at fixed neighbour URLs. Neighbours are
 *   resolved from the live ring index at click time, so the ring heals itself as members
 *   come and go and these links never go stale.
 *
 * Designed against the footer, which inverts with the theme (its background is --fg), so
 * everything here is expressed as opacity over the inherited colour.
 */
export function Webring({ className = "" }: { className?: string }) {
  return (
    <div
      data-webring={RING.id}
      className={`flex items-center gap-2.5 text-xs ${className}`}
    >
      <Hop href={RING.prev} label="previous site in the uw cs webring" glyph="←" />

      <a
        href={RING.home}
        target="_blank"
        rel="noopener"
        className="flex items-center gap-2 opacity-70 transition-opacity hover:opacity-100"
      >
        {/* The ring's mark is a dark tile, invisible against the dark side of the footer,
            so it sits on a fixed light chip. Deliberately not themed: it's someone else's
            logo and should look the same wherever it's shown. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={RING.icon}
          alt=""
          width={16}
          height={16}
          loading="lazy"
          className="block rounded-[5px] bg-white p-[2px]"
        />
        <span>{RING.label}</span>
      </a>

      <Hop href={RING.next} label="next site in the uw cs webring" glyph="→" />
    </div>
  );
}

function Hop({
  href,
  label,
  glyph,
}: {
  href: string;
  label: string;
  glyph: string;
}) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      // Padding pulled back out by the negative margin: a comfortable tap target for a
      // 12px glyph without it pushing the footer row around.
      className="-m-2 p-2 text-sm leading-none opacity-50 transition-opacity hover:opacity-100"
    >
      <span aria-hidden>{glyph}</span>
    </a>
  );
}
