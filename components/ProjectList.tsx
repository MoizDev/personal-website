import Link from "next/link";
import { CardFace } from "@/components/CardFace";
import { ToneOnScroll } from "@/components/ToneOnScroll";
import { linkLabel } from "@/lib/links";
import { PROJECTS } from "@/lib/projects";
import "./ProjectList.css";

/**
 * Phones: the projects as a plain list that scrolls like any page, each card
 * flat and the width of the screen with its write-up under it, ending on a
 * mystery card. The desktop's 3D row (CardStack) is hidden on phones and this
 * is hidden on desktops; CSS picks, so the right one is there from the first
 * paint, and the list's images only load where it shows.
 */
export function ProjectList() {
  return (
    <section className="plist" id="work" aria-label="Projects">
      {PROJECTS.map((p) => (
        <article key={p.name} className="plist-item" data-tone={p.tone}>
          <a
            className="plist-card"
            // a project with a writeup opens it here; the rest open their site in a new tab
            href={p.writeup ?? p.href}
            target={p.writeup ? undefined : "_blank"}
            rel={p.writeup ? undefined : "noreferrer"}
            aria-label={`${p.name}, ${p.year}. ${p.blurb}`}
          >
            <CardFace project={p} live sizes="calc(100vw - 40px)" />
          </a>
          <div className="plist-detail">
            <p className="detail-head">
              <span className="detail-name">{p.name}</span>
              <span className="detail-meta">
                {p.kind} &middot; {p.year}
              </span>
            </p>
            <p className="detail-about">{p.about}</p>
            <p className="plist-links">
              {p.writeup && (
                <Link className="detail-link" href={p.writeup}>
                  Read the writeup <span aria-hidden>&rarr;</span>
                </Link>
              )}
              <a className="detail-link" href={p.href} target="_blank" rel="noreferrer">
                {linkLabel(p.href)} <span aria-hidden>&#8599;</span>
              </a>
            </p>
          </div>
        </article>
      ))}

      {/* what's next */}
      <div className="plist-item plist-next" aria-hidden>
        <div className="plist-card">
          <div className="card-face">
            <div className="card-front">
              <span className="card-mystery">?</span>
            </div>
          </div>
        </div>
        <p className="plist-next-note">More on the way.</p>
      </div>

      <ToneOnScroll />
    </section>
  );
}
