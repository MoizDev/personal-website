import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "../diagram/icons";
import type { WriteupMeta } from "../types";
import { HeroVideo } from "./HeroVideo";
import { ThemeButton } from "./ThemeButton";
import { Toc } from "./Toc";
import "./writeup.css";
import "../diagram/diagram.css";

/**
 * The frame around every writeup: top bar, title, hero, team and overview,
 * contents, and the footer. An article only writes its body.
 *
 * home and index are where "Back" and "All writeups" go; change them to suit your site.
 */
export function WriteupPage({
  meta,
  others,
  children,
  home = "/",
  index = "/writeups",
}: {
  meta: WriteupMeta;
  others: WriteupMeta[];
  children: ReactNode;
  home?: string;
  index?: string;
}) {
  return (
    <div className="wu" id="top" style={{ "--wu-tone": meta.tone } as CSSProperties}>
      {/* a soft glow in the project's colour; it scrolls away with the page */}
      <div className="wu-sky" aria-hidden />

      <header className="wu-top">
        <Link href={home} className="wu-back">
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
          <h1 className="wu-title">{meta.title}</h1>
          <p className="wu-date">
            {meta.project}
            <span className="wu-date-dim">{meta.date}</span>
            {meta.occasion && <span className="wu-date-dim">{meta.occasion}</span>}
          </p>
        </div>

        <div className="wu-hero">
          {meta.hero.video ? (
            <HeroVideo poster={meta.hero.src} alt={meta.hero.alt} {...meta.hero.video} />
          ) : (
            <Image src={meta.hero.src} alt={meta.hero.alt} priority sizes="(max-width: 720px) 100vw, 662px" />
          )}
        </div>

        <section className="wu-meta" aria-label="About this project">
          <div>
            <h2 className="wu-meta-h">Team</h2>
            <ul className="wu-team">
              {meta.team.map((t) => (
                <li key={t.name}>
                  {t.href ? (
                    <a href={t.href} target="_blank" rel="noreferrer">
                      {t.name}
                    </a>
                  ) : (
                    <span>{t.name}</span>
                  )}
                  {t.role && <span className="wu-team-role">{t.role}</span>}
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
              <Link key={o.slug} href={`${index}/${o.slug}`} className="wu-more-link">
                <span>{o.title}</span>
                <span className="wu-dim">{o.project}</span>
              </Link>
            ))}
          </div>
        )}
        <div className="wu-foot-row">
          <Link href={home} className="wu-back">
            <Icon name="ArrowLeft" size={16} />
            Home
          </Link>
          <Link href={index} className="wu-toplink">
            All writeups
          </Link>
        </div>
      </footer>
    </div>
  );
}
