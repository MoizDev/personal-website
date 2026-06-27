"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { BookWithCover, BookStatus } from "@/lib/books";
import { Reveal } from "./Reveal";

function CoverImage({ book }: { book: BookWithCover }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full flex-col justify-end p-3">
        <span className="text-sm font-medium leading-tight">{book.title}</span>
        <span className="mt-1 text-xs text-[var(--muted)]">{book.author}</span>
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={book.cover}
      alt={book.title}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

const FILTERS: { key: BookStatus | "all"; label: string; dot: string }[] = [
  { key: "all", label: "all", dot: "var(--fg)" },
  { key: "to-read", label: "to read", dot: "#c9c9c9" },
  { key: "reading", label: "reading", dot: "#f0a35a" },
  { key: "read", label: "read", dot: "#34c77b" },
];

export function Bookshelf({ books }: { books: BookWithCover[] }) {
  const [filter, setFilter] = useState<BookStatus | "all">("all");

  const featured = books.find((b) => b.featured);
  const shelf = books.filter(
    (b) => !b.featured && (filter === "all" || b.status === filter)
  );

  return (
    <section id="bookshelf" className="pb-10 pt-2">
      <h2 className="flex items-center gap-3 text-3xl font-medium">
        <span className="inline-block h-3 w-3 rounded-full bg-[var(--fg)]" />
        bookshelf
      </h2>
      <p className="mt-3 text-lg italic text-[var(--muted)]">
        think before you speak, read before you think.
      </p>

      {/* status filter */}
      <div className="mt-6 flex flex-wrap items-center gap-5 text-sm">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 transition-opacity ${
              filter === f.key ? "opacity-100" : "opacity-50 hover:opacity-80"
            }`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: f.dot }}
            />
            {f.label}
          </button>
        ))}
      </div>

      {/* featured book */}
      {featured && filter === "all" && (
        <Reveal>
        <article className="mt-10 flex flex-col gap-6 border-y border-black/8 py-8 sm:flex-row sm:items-center dark:border-white/10">
          <Cover book={featured} className="w-28 shrink-0 shadow-md" />
          <div>
            <h3 className="text-2xl font-medium">{featured.title}</h3>
            <p className="mt-0.5 text-[var(--muted)]">{featured.author}</p>
            {featured.note && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                {featured.note}
              </p>
            )}
            <Stars rating={featured.rating} className="mt-3" />
          </div>
        </article>
        </Reveal>
      )}

      {/* grid */}
      <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
        {shelf.map((book, i) => (
          <Reveal key={book.title} delay={(i % 4) * 70}>
          <article className="group" title={`${book.title} — ${book.author}`}>
            <Cover
              book={book}
              className="shadow-sm transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl"
            />
            <div className="mt-3">
              {book.status === "read" ? (
                <Stars rating={book.rating} />
              ) : (
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  {book.status === "reading" ? "reading" : "to read"}
                </span>
              )}
            </div>
          </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Cover({
  book,
  className = "",
}: {
  book: BookWithCover;
  className?: string;
}) {
  return (
    <div
      className={`aspect-[2/3] overflow-hidden rounded-md bg-black/5 dark:bg-white/5 ${className}`}
    >
      <CoverImage book={book} />
    </div>
  );
}

function Stars({ rating, className = "" }: { rating?: number; className?: string }) {
  if (!rating) return null;
  return (
    <div className={`flex gap-0.5 ${className}`}>
      {Array.from({ length: rating }).map((_, i) => (
        <Star
          key={i}
          size={15}
          className="fill-[var(--accent)] text-[var(--accent)]"
        />
      ))}
    </div>
  );
}
