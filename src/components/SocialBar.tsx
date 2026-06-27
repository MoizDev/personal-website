"use client";

import { useTheme } from "./ThemeProvider";
import {
  Mail,
  Youtube,
  Linkedin,
  Github,
  XTwitter,
  Sparkle,
  Moon,
  Sun,
} from "./Icons";

const socials = [
  { label: "Email", href: "mailto:hello@moizhashmi.com", Icon: Mail },
  { label: "YouTube", href: "https://youtube.com", Icon: Youtube },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: Linkedin },
  { label: "GitHub", href: "https://github.com", Icon: Github },
  { label: "X", href: "https://x.com", Icon: XTwitter },
  { label: "More", href: "#", Icon: Sparkle },
];

export function SocialBar() {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {socials.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            target="_blank"
            rel="noreferrer"
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent)] text-white transition-transform duration-150 hover:-translate-y-0.5 hover:rotate-6"
          >
            <Icon />
          </a>
        ))}
      </div>

      <kbd className="hidden select-none items-center rounded-md border border-black/15 px-2.5 py-1.5 text-xs text-[var(--muted)] sm:inline-flex dark:border-white/15">
        ⇧ shift + o
      </kbd>

      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="grid h-9 w-9 place-items-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
      >
        {theme === "dark" ? <Sun /> : <Moon />}
      </button>
    </div>
  );
}
