import { LogoMark } from "./LogoMark";
import { Webring } from "./Webring";

const pages = [
  { label: "me", href: "/#me" },
  { label: "projects", href: "/#projects" },
  { label: "drawer of thoughts", href: "/thoughts" },
  { label: "bookshelf", href: "/bookshelf" },
  { label: "my mind", href: "/mind" },
];

export function Footer() {
  return (
    <footer
      className="relative mt-24 overflow-hidden"
      style={{ background: "var(--fg)", color: "var(--bg)" }}
    >
      <div className="relative z-10 mx-auto max-w-[1100px] px-5 pb-4 pt-16 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <a href="/#me" aria-label="Home">
            <LogoMark mono className="h-11 w-auto" />
          </a>

          <nav className="grid grid-cols-2 gap-x-12 gap-y-3 sm:flex sm:flex-col sm:items-end sm:text-right">
            {pages.map((p) => (
              <a
                key={p.label}
                href={p.href}
                className="text-sm opacity-60 transition-opacity hover:opacity-100"
              >
                {p.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Colophon row: name and © as one unit on the left, ring badge on the right
            under the page list. Wraps rather than crushes if the row runs out of width. */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-4 gap-y-5 text-xs">
          <div className="flex items-center gap-3">
            <span className="opacity-70">moiz hashmi</span>
            <span className="opacity-50">© {new Date().getFullYear()}</span>
          </div>

          <Webring />
        </div>
      </div>

      {/* massive Urdu name — an overlay sitting behind the footer content,
          clipped only at the bottom edge of the footer */}
      <div
        aria-hidden
        dir="rtl"
        lang="ur"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 translate-y-[-4%] select-none whitespace-nowrap text-center leading-none [font-family:var(--font-urdu)] text-[clamp(3rem,11vw,9rem)]"
        style={{ color: "var(--bg)", opacity: 0.08 }}
      >
        معز احمد ہاشمی
      </div>
    </footer>
  );
}
