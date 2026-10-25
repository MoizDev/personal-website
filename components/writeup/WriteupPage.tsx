import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/diagram/icons";
import type { WriteupMeta } from "@/lib/writeups";
import { ThemeButton } from "./ThemeButton";
import { Toc } from "./Toc";
import "./writeup.css";
import "@/components/diagram/diagram.css";

/** The frame around every writeup: top bar, title, hero, team and overview, contents, and the footer. */
export function WriteupPage({ meta, others, children }: { meta: WriteupMeta; others: WriteupMeta[]; children: ReactNode }) {
  return (
    <div className="wu" id="top" style={{ "--wu-tone": meta.tone } as React.CSSProperties}>
      <header className="wu-top">
        <Link href="/" className="wu-back">
          <Icon name="ArrowLeft" size={16} />
          Back
        </Link>
        <div className="wu-top-right">
          {meta.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="wu-toplink">
              {l.label}
              <Icon name="ArrowUpRight" size={15} />
            </a>
          ))}
          <ThemeButton />
        </div>
      </header>

      <Toc sections={meta.sections} />

      <article className="wu-article">
        <div className="wu-head">
          <h1 className="wu-title">{meta.project}</h1>
          <p className="wu-date">
            {meta.date}
            {meta.occasion && <span className="wu-date-dim">{meta.occasion}</span>}
          </p>
        </div>

        <div className="wu-hero">
          <Image src={meta.hero.src} alt={meta.hero.alt} priority sizes="(max-width: 720px) 100vw, 662px" />
        </div>

        <section className="wu-meta" aria-label="About this project">
          <div>
            <h2 className="wu-meta-h">Team</h2>
            <ul className="wu-team">
              {meta.team.map((t) => (
                <li key={t.name}>
                  <span>{t.name}</span>
                  <span className="wu-team-role">{t.role}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="wu-meta-h">Overview</h2>
            <p className="wu-overview">{meta.overview}</p>
          </div>
        </section>

        <div className="wu-body">{children}</div>
      </article>

      <footer className="wu-foot">
        {others.length > 0 && (
          <div className="wu-more">
            <p className="wu-meta-h">More writeups</p>
            {others.map((o) => (
              <Link key={o.slug} href={`/writeups/${o.slug}`} className="wu-more-link">
                <span>{o.title}</span>
                <span className="wu-dim">{o.project}</span>
              </Link>
            ))}
          </div>
        )}
        <div className="wu-foot-row">
          <Link href="/" className="wu-back">
            <Icon name="ArrowLeft" size={16} />
            All work
          </Link>
          <Link href="/writeups" className="wu-toplink">
            All writeups
          </Link>
        </div>
      </footer>
    </div>
  );
}
