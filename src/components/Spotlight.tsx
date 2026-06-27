"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  FileText,
  Hash,
  FolderGit2,
} from "lucide-react";
import { searchItems, type SearchItem, type SearchKind } from "@/lib/search";

export function Spotlight({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchItems;
    return searchItems.filter((it) =>
      [it.title, it.section, ...(it.keywords ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  // keep the highlighted row in view
  useEffect(() => {
    listRef.current
      ?.querySelectorAll("li")
      [active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const go = (item?: SearchItem) => {
    if (!item) return;
    onClose();
    // on-page anchor takes priority — scroll to it if it exists
    if (item.anchor) {
      const el = document.querySelector(item.anchor);
      if (el) {
        (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    if (item.href) router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-start justify-center px-4 pt-[18vh]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl dark:border-white/10"
        style={{ background: "color-mix(in srgb, var(--bg) 65%, transparent)" }}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-black/10 px-4 dark:border-white/10">
          <Search size={18} className="text-[var(--muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and content…"
            className="w-full bg-transparent py-4 text-base outline-none placeholder:text-[var(--muted)]"
          />
          <kbd className="rounded-md border border-black/15 px-1.5 py-0.5 text-[10px] text-[var(--muted)] dark:border-white/15">
            esc
          </kbd>
        </div>

        <ul ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-[var(--muted)]">
              No results
            </li>
          )}
          {results.map((item, i) => (
            <li key={item.id}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--fg)] transition"
                style={
                  i === active
                    ? {
                        background:
                          "color-mix(in srgb, var(--accent) 14%, transparent)",
                      }
                    : undefined
                }
              >
                <KindIcon kind={item.kind} />
                <span className="flex-1">{item.title}</span>
                {item.section && (
                  <span className="text-xs text-[var(--muted)]">
                    {item.section}
                  </span>
                )}
                {i === active && (
                  <CornerDownLeft size={14} className="text-[var(--muted)]" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KindIcon({ kind }: { kind: SearchKind }) {
  const cls = "shrink-0 text-[var(--muted)]";
  if (kind === "project") return <FolderGit2 size={16} className={cls} />;
  if (kind === "section") return <Hash size={16} className={cls} />;
  return <FileText size={16} className={cls} />;
}
