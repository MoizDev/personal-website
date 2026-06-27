"use client";

import { usePathname } from "next/navigation";
import { LogoMark } from "./LogoMark";

const nav = [
  { label: "me", href: "/", page: "/", home: true },
  { label: "projects", href: "/#projects", page: "/" },
  { label: "drawer of thoughts", href: "/thoughts", page: "/thoughts" },
  { label: "bookshelf", href: "/bookshelf", page: "/bookshelf" },
];

// nav rows whose vertical position lines up with content on the right, so the
// blue rule can run across both sides. Tweak these indices to re-align.
const ruledRows = [0, 1];

export function Sidebar() {
  const pathname = usePathname();
  // the notebook rules belong on home + the drawer-of-thoughts list (whose
  // title/subheading are aligned to them); hidden on bookshelf etc.
  const showRules = pathname === "/" || pathname === "/thoughts";
  // the staggered entrance only runs on the home hero
  const animateIn = pathname === "/";

  // a dedicated page is "active" on its own route; on home, only "me" lights up
  const isActive = (item: (typeof nav)[number]) =>
    item.page === "/" ? pathname === "/" && !!item.home : pathname.startsWith(item.page);

  // "me" / logo go to the very top of home (not the #me anchor, which leaves
  // the page slightly scrolled past the top padding)
  const goHomeTop = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <aside className="relative hidden flex-col items-start py-10 lg:flex">
      <a
        href="/"
        aria-label="Home"
        onClick={goHomeTop}
        className={`mb-8 inline-block ${animateIn ? "hero-rise" : ""}`}
        style={{ ["--i" as string]: 0 }}
      >
        <LogoMark className="h-9 w-auto" />
      </a>

      {/* dropped down so the list lines up with the "computer science" row.
          Only the rows that line up with content on the right get a full
          ruled line that runs across the page. */}
      <nav className="mt-20 flex w-full flex-col gap-8">
        {nav.map((item, i) => {
          const active = isActive(item);
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={item.home ? goHomeTop : undefined}
              style={{ ["--i" as string]: i + 1 }}
              className={`block w-full pr-3 text-right transition-colors hover:text-[var(--fg)] ${
                animateIn ? "hero-rise" : ""
              } ${showRules && ruledRows.includes(i) ? "rule-through" : ""} ${
                showRules && i === 0 ? "rule-top" : ""
              } ${
                i === 0 ? "text-lg" : "text-base"
              } ${
                active
                  ? "font-medium text-[var(--fg)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* red notebook margin line in the gutter (home only) */}
      {showRules && <span className="margin-line" aria-hidden />}
    </aside>
  );
}
