import { CardStack } from "@/components/CardStack";
import dynamic from "next/dynamic";
import Image from "next/image";
import arion from "@/assets/arion.png";
// not public yet: the General Magic line below is commented out until it is
// import generalMagic from "@/assets/generalmagic.png";
import { Navbar } from "@/components/Navbar";
import { ProjectList } from "@/components/ProjectList";
import { LINKS, newTab } from "@/lib/links";
import { SolarSystem } from "@/components/SolarSystem";
import { PERSON, jsonLd } from "@/lib/site";

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
      {/* who this is, for search engines */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(PERSON) }} />
      <SolarSystem />
      <CardStack />
      <Navbar />

      <header className="intro">
        <h1 className="intro-name">Moiz Hashmi</h1>
        <p className="intro-bio">
          I’m a computer science student at the University of Waterloo.
          Currently, I’m an engineer at{" "}
          <a className="org" href="https://arion.nyc" {...newTab("https://arion.nyc")}>
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
          {/* not public yet
          Incoming at{" "}
          <a className="org" href="https://generalmagic.inc" {...newTab("https://generalmagic.inc")}>
            <Image className="org-icon org-icon-plain" src={generalMagic} alt="" width={44} height={44} />
            <span>General Magic</span>
          </a>{" "}
          this winter.
          */}
        </p>
        <nav className="intro-links" aria-label="Elsewhere">
          {Object.values(LINKS).map((l) => (
            <a key={l.label} href={l.href} {...newTab(l.href)}>
              {l.label}
            </a>
          ))}
        </nav>
      </header>

      {/* phones: the projects as a list under the intro, instead of the 3D row */}
      <ProjectList />

      <TunePanel />
      <SolarPanel />
    </main>
  );
}
