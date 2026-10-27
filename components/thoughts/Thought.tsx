import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/diagram/icons";
import { ThemeButton } from "@/components/writeup/ThemeButton";
import { SITE, jsonLd } from "@/lib/site";
import { getRelated, readingTime, type Article, type Block } from "@/lib/thoughts";
import "@/components/writeup/writeup.css";
import "./thoughts.css";

type Neighbour = { slug: string; title: string } | null;

/** The frame for the essay pages: the writeups' top bar and column, with a way back. */
export function ThoughtsFrame({ back, children }: { back: { href: string; label: string }; children: ReactNode }) {
  return (
    <div className="wu th" style={{ "--wu-tone": "#03a5fc" } as React.CSSProperties}>
      <header className="wu-top">
        <Link href={back.href} className="wu-back">
          <Icon name="ArrowLeft" size={16} />
          {back.label}
        </Link>
        <div className="wu-top-right">
          <ThemeButton />
        </div>
      </header>
      <main className="wu-article">{children}</main>
    </div>
  );
}

/** Turns "[label](href)" in the text into links; links off the site open in a new tab. */
function inline(text: string) {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const [whole, label, href] = m;
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      /^https?:/.test(href) ? (
        <a key={m.index} href={href} target="_blank" rel="noreferrer">
          {label}
        </a>
      ) : (
        <Link key={m.index} href={href}>
          {label}
        </Link>
      ),
    );
    last = m.index + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function BlockView({ block }: { block: Block }) {
  if (block.type === "h2") return <h2 className="wu-h2">{block.text}</h2>;
  if (block.type === "quote")
    return (
      <blockquote className="wu-quote">
        <p>{inline(block.text)}</p>
      </blockquote>
    );
  return <p>{inline(block.text)}</p>;
}

/** One essay: title, body, related essays, and the ones either side of it. */
export function Thought({ article, prev, next }: { article: Article; prev: Neighbour; next: Neighbour }) {
  const related = getRelated(article.slug);
  const url = `${SITE.url}/thoughts/${article.slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.blurb,
    datePublished: article.published ?? article.date,
    author: { "@type": "Person", name: SITE.name, url: SITE.url },
    mainEntityOfPage: url,
    url,
    keywords: article.keywords?.join(", "),
  };

  return (
    <ThoughtsFrame back={{ href: "/thoughts", label: "Drawer of thoughts" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <div className="wu-head">
        <h1 className="wu-title">{article.title}</h1>
        <p className="wu-date">
          {article.date}
          <span className="wu-date-dim">{readingTime(article)}</span>
        </p>
      </div>

      <div className="wu-body th-body">
        <p className="wu-lede">{article.blurb}</p>
        {article.content.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
      </div>

      {related.length > 0 && (
        <section className="th-related" aria-label="Related thoughts">
          <h2 className="th-kicker">Related</h2>
          <ul>
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/thoughts/${r.slug}`}>
                  <span className="th-related-title">{r.title}</span>
                  <span className="th-related-blurb">{r.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(prev || next) && (
        <nav className="th-pager" aria-label="More thoughts">
          {prev ? (
            <Link href={`/thoughts/${prev.slug}`}>
              <span className="th-kicker">Previous</span>
              {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/thoughts/${next.slug}`} className="th-next">
              <span className="th-kicker">Next</span>
              {next.title}
            </Link>
          )}
        </nav>
      )}
    </ThoughtsFrame>
  );
}
