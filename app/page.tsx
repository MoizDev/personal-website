import { CardStack } from "@/components/CardStack";
import dynamic from "next/dynamic";

// Sliders for the scene, for development only. Behind a dynamic import in a
// dead branch so production builds drop the panel entirely.
const TunePanel =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/TunePanel").then((m) => m.TunePanel))
    : () => null;

const LINKS = [
  { label: "Resume", href: "/resume.pdf" },
  { label: "GitHub", href: "https://github.com/MoizDev" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/moiz-ahmed-hashmi-a36670213/" },
  { label: "Email", href: "mailto:hashmoiz1546@gmail.com" },
];

export default function Home() {
  return (
    <main className="home">
      <CardStack />

      <header className="intro">
        {/* the name is for search engines and screen readers; the bio speaks for itself */}
        <h1 className="sr-only">Moiz Hashmi</h1>
        <p className="intro-bio">
          I’m a software engineer and student at the University of Waterloo. Currently, I’m an engineer at{" "}
          <a href="https://arion.nyc">Arion.nyc</a>, building novel, <span className="nowrap">AI-native</span> consumer experiences.
        </p>
        <nav className="intro-links" aria-label="Elsewhere">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </header>

      <TunePanel />
    </main>
  );
}
