import { XTwitter, Linkedin, Github } from "./Icons";
import { SOCIALS } from "@/lib/site";

const socials = [
  { label: "X", href: SOCIALS.x, Icon: XTwitter },
  { label: "LinkedIn", href: SOCIALS.linkedin, Icon: Linkedin },
  { label: "GitHub", href: SOCIALS.github, Icon: Github },
];

export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {socials.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
        >
          <Icon width={17} height={17} />
        </a>
      ))}
    </div>
  );
}
