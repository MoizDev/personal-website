import { CardStack } from "@/components/CardStack";
import dynamic from "next/dynamic";
import Image from "next/image";
import arion from "@/assets/arion.png";
import { Navbar } from "@/components/Navbar";
import { LINKS } from "@/lib/links";
import { SolarSystem } from "@/components/SolarSystem";

// Sliders for the scene, for development only. Behind a dynamic import in a
// dead branch so production builds drop the panel entirely.
// Hidden for now: set SHOW_TUNE to true to bring it back.
const SHOW_TUNE = false;
const TunePanel =
  SHOW_TUNE && process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/TunePanel").then((m) => m.TunePanel))
    : () => null;

// Sliders for the solar system in the background, development only. "]" hides it.
// Hidden for now: set SHOW_SOLAR to true to bring it back.
const SHOW_SOLAR = false;
const SolarPanel =
  SHOW_SOLAR && process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/SolarPanel").then((m) => m.SolarPanel))
    : () => null;

export default function Home() {
  return (
    <main className="home">
      <SolarSystem />
      <CardStack />
      <Navbar />

      <header className="intro">
        <h1 className="intro-name">Moiz Hashmi</h1>
        <p className="intro-bio">
          I’m a computer science student at the University of Waterloo.
          Currently, I’m an engineer at{" "}
          <a className="org" href="https://arion.nyc">
            <Image
              className="org-icon"
              src={arion}
              alt=""
              width={44}
              height={44}
            />
            <span>Arion.nyc</span>
          </a>
          , building novel, <span className="nowrap">AI-native</span> consumer
          experiences.
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
      <SolarPanel />
    </main>
  );
}
