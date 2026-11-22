import Link from "next/link";
import { CardFace } from "@/components/CardFace";
import { CarouselBar } from "@/components/CarouselBar";
import { linkLabel } from "@/lib/links";
import { PROJECTS } from "@/lib/projects";
import "./ProjectList.css";

/**
 * Phones: the projects as a flat carousel you swipe through sideways, one card
 * at a time with its neighbours peeking in at the edges, each card's write-up
 * under it, and arrows and a count below (CarouselBar). The swipe and the
 * snapping are the browser's own scrolling, and the cards easing in and out
 * as they pass the middle is a scroll-driven animation, so none of it runs
 * script. It ends on a mystery card.
 *
 * The desktop's 3D row (CardStack) is hidden on phones and this is hidden on
 * desktops; CSS picks, so the right one is there from the first paint, and
 * the carousel's images only load where it shows.
 */
export function ProjectList() {
  const count = PROJECTS.length + 1;
  return (
    <section className="plist" id="work" aria-roledescription="carousel" aria-label="Projects">
      <div className="plist-track" tabIndex={-1}>
        {PROJECTS.map((p, i) => (
          <article
            key={p.name}
            className="plist-item"
            data-tone={p.tone}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${p.name}`}
          >
            <a
              className="plist-card"
              // a project with a writeup opens it here; the rest open their site in a new tab
              href={p.writeup ?? p.href}
              target={p.writeup ? undefined : "_blank"}
              rel={p.writeup ? undefined : "noreferrer"}
              aria-label={`${p.name}, ${p.year}. ${p.blurb}`}
              draggable={false}
            >
              <CardFace project={p} live sizes="calc(100vw - 56px)" />
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
        <div className="plist-item plist-next" aria-roledescription="slide" aria-label={`${count} of ${count}: more on the way`}>
          <div className="plist-card">
            <div className="card-face">
              <div className="card-front">
                <span className="card-mystery" aria-hidden>
                  ?
                </span>
              </div>
            </div>
          </div>
          <p className="plist-next-note">More on the way.</p>
        </div>
      </div>

      <CarouselBar count={count} />
    </section>
  );
}
