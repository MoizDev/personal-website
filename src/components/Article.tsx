import { ChevronLeft } from "lucide-react";
import { Footer } from "./Footer";
import { ReadingProgress } from "./ReadingProgress";
import {
  readingTime,
  getRelated,
  type Article as ArticleType,
  type Block,
} from "@/lib/thoughts";
import { SITE } from "@/lib/site";

type NavLink = { slug: string; title: string } | null;

// turn [label](href) into links; internal links keep you on-site (good for SEO),
// external ones open in a new tab.
function renderInline(text: string) {
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [, label, href] = m;
    const external = /^https?:/.test(href);
    out.push(
      <a
        key={key++}
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className="text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-2 transition-colors hover:decoration-[var(--accent)]"
      >
        {label}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Article({
  article,
  image,
  prev,
  next,
}: {
  article: ArticleType;
  image: string | null;
  prev: NavLink;
  next: NavLink;
}) {
  const related = getRelated(article.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.blurb,
    datePublished: article.published ?? article.date,
    dateModified: article.published ?? article.date,
    author: { "@type": "Person", name: SITE.author, url: SITE.url },
    publisher: { "@type": "Person", name: SITE.author },
    mainEntityOfPage: `${SITE.url}/thoughts/${article.slug}`,
    url: `${SITE.url}/thoughts/${article.slug}`,
    keywords: article.keywords?.join(", "),
    ...(image
      ? { image: image.startsWith("http") ? image : `${SITE.url}${image}` }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />

      <div className="relative overflow-x-hidden">
        {/* title block */}
        <header className="mx-auto max-w-[760px] px-5 pt-24 sm:px-8 sm:pt-28">
          <a
            href="/thoughts"
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
          >
            <ChevronLeft size={15} />
            drawer of thoughts
          </a>

          <div className="mt-10 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            {article.date} · {readingTime(article)}
          </div>
          <h1 className="mt-4 text-[clamp(1.9rem,4.2vw,2.9rem)] font-normal leading-[1.08] [font-family:var(--font-serif)]">
            {article.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[var(--muted)]">
            {article.blurb}
          </p>

          <ByLine />
        </header>

        {/* banner */}
        {image && (
          <figure className="mx-auto mt-12 max-w-[1000px] px-5 sm:px-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              className="aspect-[16/7] w-full object-cover"
            />
          </figure>
        )}

        {/* body */}
        <article className="mx-auto mt-14 max-w-[680px] px-5 pb-10 sm:px-8">
          {article.content.map((block, i) => (
            <BlockView
              key={i}
              block={block}
              lead={i === 0 && block.type === "p"}
            />
          ))}
        </article>

        {/* related — internal backlinks for readers and crawlers */}
        {related.length > 0 && (
          <section
            aria-label="Related thoughts"
            className="mx-auto max-w-[680px] px-5 pt-4 sm:px-8"
          >
            <h2 className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              related thoughts
            </h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <a
                    href={`/thoughts/${r.slug}`}
                    className="group block"
                    rel="bookmark"
                  >
                    <span className="font-medium text-[var(--fg)] transition-colors group-hover:text-[var(--accent)]">
                      {r.title}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      {" — "}
                      {r.blurb}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* prev / next */}
        {(prev || next) && (
          <nav className="mx-auto flex max-w-[680px] gap-6 border-t border-black/10 px-5 pb-28 pt-8 sm:px-8 dark:border-white/10">
            {prev ? (
              <a href={`/thoughts/${prev.slug}`} className="group max-w-[45%]">
                <div className="text-xs uppercase tracking-wider text-[var(--muted)]">
                  ← previous
                </div>
                <div className="mt-1 text-[var(--fg)] transition-colors group-hover:text-[var(--accent)]">
                  {prev.title}
                </div>
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a
                href={`/thoughts/${next.slug}`}
                className="group ml-auto max-w-[45%] text-right"
              >
                <div className="text-xs uppercase tracking-wider text-[var(--muted)]">
                  next →
                </div>
                <div className="mt-1 text-[var(--fg)] transition-colors group-hover:text-[var(--accent)]">
                  {next.title}
                </div>
              </a>
            )}
          </nav>
        )}
      </div>

      <Footer />
    </>
  );
}

// Quirky credit line — spawns automatically on every article.
function ByLine() {
  return (
    <div className="mt-6 space-y-1 text-sm text-[var(--muted)]">
      <div className="flex flex-wrap items-center gap-x-1.5">
        <span>authored by moiz &amp;</span>
        <span className="inline-flex items-center gap-1 text-[var(--fg)]">
          claude
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/claude.svg" alt="Claude" className="h-[15px] w-[15px]" />
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-1.5">
        <span>sourced from my diabolical hurricane of an obsidian</span>
        <span className="inline-flex items-center gap-1 text-[var(--fg)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/obsidian.svg" alt="Obsidian" className="h-[15px] w-[15px]" />
          vault
        </span>
      </div>
    </div>
  );
}

function BlockView({ block, lead }: { block: Block; lead: boolean }) {
  if (block.type === "h2") {
    return (
      <h2 className="mt-12 text-2xl font-semibold leading-snug">{block.text}</h2>
    );
  }
  if (block.type === "quote") {
    return (
      <blockquote className="my-8 border-l-2 border-[var(--accent)] pl-5 text-base leading-[1.55] [font-family:var(--font-serif)]">
        {renderInline(block.text)}
      </blockquote>
    );
  }
  return (
    <p
      className={`mt-6 text-base leading-[1.8] ${
        lead
          ? "first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-5xl first-letter:font-semibold first-letter:leading-[0.78] first-letter:[font-family:var(--font-serif)]"
          : ""
      }`}
    >
      {renderInline(block.text)}
    </p>
  );
}
