import { CardStack } from "@/components/CardStack";
import dynamic from "next/dynamic";
import Image from "next/image";
import arion from "@/assets/arion.png";
import { Navbar } from "@/components/Navbar";
import { LINKS } from "@/lib/links";

// Sliders for the scene, for development only. Behind a dynamic import in a
// dead branch so production builds drop the panel entirely.
const TunePanel =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/TunePanel").then((m) => m.TunePanel))
    : () => null;

export default function Home() {
  return (
    <main className="home">
      <CardStack />
      <Navbar />

      <header className="intro">
        <h1 className="intro-name">Moiz Hashmi</h1>
        <p className="intro-bio">
          I’m a software engineer and student at the University of Waterloo. Currently, I’m an engineer at{" "}
          <a className="org" href="https://arion.nyc">
            <Image className="org-icon" src={arion} alt="" width={44} height={44} />
            <span>Arion.nyc</span>
          </a>, building novel, <span className="nowrap">AI-native</span> consumer experiences.
        </p>
        <nav className="intro-links" aria-label="Elsewhere">
          {Object.values(LINKS).map((l) => (
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
