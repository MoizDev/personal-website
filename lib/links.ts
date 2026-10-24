export const EMAIL = "hashmoiz1546@gmail.com";

export const LINKS = {
  resume: { label: "Resume", href: "/resume.pdf" },
  github: { label: "GitHub", href: "https://github.com/MoizDev" },
  linkedin: { label: "LinkedIn", href: "https://www.linkedin.com/in/moiz-ahmed-hashmi-a36670213/" },
  email: { label: "Email", href: `mailto:${EMAIL}` },
};

/**
 * Props that open a link in a new tab, so the site stays open behind it.
 * Email links are left alone: they open the mail app, and a new tab would sit empty.
 */
export const newTab = (href: string) =>
  href.startsWith("mailto:") ? {} : ({ target: "_blank", rel: "noreferrer" } as const);
