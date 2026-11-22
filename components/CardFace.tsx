import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { CardLines } from "@/components/CardLines";
import type { Project } from "@/lib/projects";

/**
 * What's printed on a project's card: its line drawing, screenshot or logo,
 * and name, with an award badge where it has one. The desktop's 3D row
 * (CardStack) and the phone's list (ProjectList) both use it, so a card looks
 * the same in either.
 *
 * `live` shows the badge (in the row, once the card is in the spot); `sizes`
 * says how wide the screenshot shows, for picking its file.
 */
export function CardFace({ project: p, live, sizes }: { project: Project; live: boolean; sizes: string }) {
  return (
    <Body
      tone={p.tone}
      outside={
        p.badge && (
          <span className="card-badge" data-live={live}>
            <span className="card-badge-title">{p.badge.title}</span>
            <span className="card-badge-detail">{p.badge.detail}</span>
          </span>
        )
      }
    >
      <CardLines art={p.lines} />
      {p.art.kind === "shot" ? (
        <Image className="card-shot" src={p.art.src} alt="" sizes={sizes} draggable={false} />
      ) : (
        <div className="card-logo">
          <Image className="card-logo-mark" src={p.art.src} alt="" draggable={false} />
          <span className="card-logo-tag">{p.art.tagline}</span>
        </div>
      )}
      {live && p.video && (
        <video className="card-shot card-video" src={p.video} autoPlay muted loop playsInline aria-hidden />
      )}
      <span className="card-name">
        <Image className="card-name-logo" src={p.logo} alt="" draggable={false} />
        {p.name}
      </span>
    </Body>
  );
}

/**
 * A card: one flat layer holding what's printed on it and the gloss, plus
 * anything that sticks out past its edge (`outside`, not clipped by the plate). (Printed
 * layers as separate 3D planes sit too close together for the browser to sort,
 * so they cut through each other; the hover parallax slides them within the
 * face instead.)
 */
export function Body({ tone, children, outside }: { tone: string; children: ReactNode; outside?: ReactNode }) {
  return (
    <div className="card-face" style={{ "--tone": tone } as CSSProperties}>
      <div className="card-front">{children}</div>
      {outside}
    </div>
  );
}
