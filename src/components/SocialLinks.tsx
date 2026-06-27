import { XTwitter, Linkedin, Github } from "./Icons";

const socials = [
  { label: "X", href: "https://x.com/moizhashmi0", Icon: XTwitter },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/moiz-ahmed-hashmi-a36670213/",
    Icon: Linkedin,
  },
  { label: "GitHub", href: "https://github.com/MoizDev", Icon: Github },
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
