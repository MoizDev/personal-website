/**
 * The pieces a writeup is written with. Prose is plain <p>; everything else is
 * one of these. See writeups/README.md for when to reach for which.
 */

import Image, { type StaticImageData } from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/diagram/icons";
import type { Section } from "@/lib/writeups";
import { dedent, lineSet, tokenize, toLines, type Lang } from "./highlight";

/** A chapter heading: a level 2 section. */
export function Chapter({ s }: { s: Section }) {
  return (
    <h2 id={s.id} className="wu-h2">
      {s.title}
    </h2>
  );
}

/** A sub-heading inside a chapter: a level 3 section. */
export function Sub({ s }: { s: Section }) {
  return (
    <h3 id={s.id} className="wu-h3">
      {s.title}
    </h3>
  );
}

/** "Under the hood": a quieter panel for the technical detail, with its own heading in the contents. */
export function Hood({ s, children }: { s: Section; children: ReactNode }) {
  return (
    <section className="wu-hood" aria-labelledby={s.id}>
      <p className="wu-hood-kicker">
        <Icon name="Wrench" size={13} />
        Under the hood
      </p>
      <h3 id={s.id} className="wu-h3">
        {s.title}
      </h3>
      {children}
    </section>
  );
}

/** A numbered figure with a caption. wide breaks out of the text column. */
export function Figure({
  title,
  caption,
  wide,
  bare,
  tools,
  children,
}: {
  title?: string;
  caption?: ReactNode;
  wide?: boolean;
  /** no panel behind it (for photos that bring their own) */
  bare?: boolean;
  /** a row above the frame, on the right, for a diagram's play controls */
  tools?: boolean;
  children: ReactNode;
}) {
  return (
    <figure className={`wu-fig${wide ? " wu-wide" : ""}`}>
      {tools && <div className="wu-fig-tools" />}
      <div className={bare ? "wu-fig-bare" : "wu-fig-panel"}>{children}</div>
      {(title || caption) && (
        <figcaption className="wu-cap">
          <span className="wu-cap-title">{title}</span>
          {caption && <span className="wu-cap-text">{caption}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/** An image inside a figure. `quality` must be listed in images.qualities in next.config.ts. */
export function Shot({
  src,
  alt,
  contain,
  style,
  quality,
}: {
  src: StaticImageData;
  alt: string;
  contain?: boolean;
  style?: CSSProperties;
  quality?: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      className={`wu-shot${contain ? " wu-shot-contain" : ""}`}
      sizes="(max-width: 1000px) 100vw, 960px"
      quality={quality}
      style={style}
    />
  );
}

/** An inline label with an icon tile, for names of things in a sentence. */
export function Chip({ icon, tone, children }: { icon: string; tone?: string; children: ReactNode }) {
  return (
    <span className="wu-chip wu-chip-inline" data-tone={tone}>
      <span className="wu-chip-icon">
        <Icon name={icon} size={13} />
      </span>
      {children}
    </span>
  );
}

/** A line set apart for weight: "I was asleep." */
export function Beat({ children }: { children: ReactNode }) {
  return <p className="wu-beat">{children}</p>;
}

/** A pull quote, with who said it. */
export function Quote({ children, who }: { children: ReactNode; who?: string }) {
  return (
    <blockquote className="wu-quote">
      <p>{children}</p>
      {who && <cite>{who}</cite>}
    </blockquote>
  );
}

/** Photos dropped on the table: slightly turned, each with a handwritten-style label. */
export function Polaroids({ items }: { items: { src: StaticImageData; alt: string; label: string }[] }) {
  const turns = [-4, 2.5, -1.5, 3.5, -3, 1.5];
  return (
    <div className="wu-polaroids">
      {items.map((it, i) => (
        <div key={it.label} className="wu-polaroid" style={{ "--turn": `${turns[i % turns.length]}deg` } as CSSProperties}>
          <Image src={it.src} alt={it.alt} sizes="300px" />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/** The picture next to what was built from it. */
export function Pair({
  concept,
  built,
  idea,
}: {
  concept: StaticImageData;
  built: StaticImageData;
  idea: string;
}) {
  return (
    <div className="wu-pair">
      <div className="wu-pair-side">
        <Image src={concept} alt={`The imagined ${idea}, drawn by an image model`} sizes="420px" />
        <span className="wu-pair-tag">
          <Icon name="Image" size={13} /> Imagined
        </span>
      </div>
      <div className="wu-pair-arrow" aria-hidden>
        <Icon name="ArrowRight" size={18} />
      </div>
      <div className="wu-pair-side">
        <Image src={built} alt={`The ${idea} as built by the geometry kernel, brick by brick`} sizes="420px" />
        <span className="wu-pair-tag">
          <Icon name="brick" size={13} /> Built
        </span>
      </div>
    </div>
  );
}

/**
 * Detail for one step of a flow diagram, passed through <Diagram panes={{ id: <Pane …/> }}>.
 * Shows up to four small pictures beside a kicker and a few lines of text.
 */
export function Pane({ kicker, imgs, children }: { kicker: string; imgs?: StaticImageData[]; children: ReactNode }) {
  return (
    <div className="dg-detail" data-text-only={!imgs?.length}>
      {!!imgs?.length && (
        <div className="dg-detail-imgs">
          {imgs.map((src, i) => (
            <Image key={i} src={src} alt="" sizes="180px" />
          ))}
        </div>
      )}
      <div>
        <p className="dg-detail-k">{kicker}</p>
        <p className="dg-detail-t">{children}</p>
      </div>
    </div>
  );
}

/**
 * Two or three short points side by side, each under a small icon: the
 * constraints of a design, the parts of a check, the rules of a match.
 */
export function Points({ children }: { children: ReactNode }) {
  const n = Array.isArray(children) ? children.filter(Boolean).length : 1;
  return (
    <div className="wu-points" data-cols={n % 3 === 0 ? 3 : 2}>
      {children}
    </div>
  );
}

/** One point inside <Points>: an icon, an optional title, and a sentence or two. */
export function Point({ icon, tone, title, children }: { icon: string; tone?: string; title?: string; children: ReactNode }) {
  return (
    <div className="wu-point" data-tone={tone}>
      <span className="wu-point-icon">
        <Icon name={icon} size={16} />
      </span>
      {title && <p className="wu-point-title">{title}</p>}
      <p className="wu-point-text">{children}</p>
    </div>
  );
}

/** Big numbers with a label under each, for a before and after. Put it in a bare <Figure>. */
export function Stats({ items }: { items: { value: string; label: string; tone?: string }[] }) {
  return (
    <div className="wu-stats">
      {items.map((it) => (
        <div key={it.label} className="wu-stat" data-tone={it.tone}>
          <span className="wu-stat-value">{it.value}</span>
          <span className="wu-stat-label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

const LANG_NAME: Record<Lang, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  tsx: "TSX",
  py: "Python",
  json: "JSON",
  sh: "Shell",
  rkt: "Racket",
  text: "",
};

/**
 * A short, simplified snippet that explains an idea, with its syntax coloured.
 * Not a copy of the repo: cut it down to the lines that make the point.
 *
 *   <Code lang="py" label="kernel.py" mark="3-4" caption="…">{`…`}</Code>
 *
 * mark lights up lines (counting from 1), such as "3-4, 7". The source is a
 * template string; its shared indent and blank edges are trimmed.
 */
export function Code({
  lang = "text",
  label,
  mark,
  caption,
  children,
}: {
  lang?: Lang;
  /** a file name or a short label, in a bar above the code */
  label?: string;
  /** lines to light up, such as "3-4, 7" */
  mark?: string | number[];
  caption?: ReactNode;
  children: string;
}) {
  const lines = toLines(tokenize(dedent(children), lang));
  const marked = lineSet(mark);
  return (
    <figure className="wu-code" data-marked={marked.size > 0 || undefined}>
      {label && (
        <div className="wu-code-head">
          <span className="wu-code-label">{label}</span>
          {LANG_NAME[lang] && <span className="wu-code-lang">{LANG_NAME[lang]}</span>}
        </div>
      )}
      <pre className="wu-code-pre">
        <code>
          {lines.map((line, i) => (
            <span key={i}>
              <span className="wu-code-line" data-mark={marked.has(i + 1) || undefined}>
                {line.map((t, j) =>
                  t.kind ? (
                    <span key={j} className={`tk-${t.kind}`}>
                      {t.text}
                    </span>
                  ) : (
                    t.text
                  ),
                )}
              </span>
              {i < lines.length - 1 && "\n"}
            </span>
          ))}
        </code>
      </pre>
      {caption && <figcaption className="wu-code-cap">{caption}</figcaption>}
    </figure>
  );
}
