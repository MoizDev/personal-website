import Link from "next/link";
import { Tangram } from "@/components/Tangram";

export default function Home() {
  return (
    <main className="page">
      <header className="nav">
        <Link href="/" className="nav-name">
          Moiz Hashmi
        </Link>
        <nav aria-label="Main">
          <a href="#projects">projects</a>
          <a href="/resume.pdf">resume</a>
          <a href="https://github.com/MoizDev">github</a>
        </nav>
      </header>

      <div className="bio">
        <p>I&apos;m a Computer Science student at the University of Waterloo.</p>
        <p>
          I co-founded <a href="https://factful.io/">Factful</a>, an AI startup that checks the claims in
          student essays against real sources. Most recently, I won Hack the North 2026 with{" "}
          <a href="https://devpost.com/software/a-feuvb1">Bricked</a>, which turns a sentence into a LEGO
          model you can actually build.
        </p>
        <p className="bio-quiet">
          You can find me on <a href="https://github.com/MoizDev">GitHub</a> and{" "}
          <a href="https://www.linkedin.com/in/moiz-ahmed-hashmi-a36670213/">LinkedIn</a>, or reach me via{" "}
          <a href="mailto:hashmoiz1546@gmail.com">email</a>.
        </p>
      </div>

      <Tangram />
    </main>
  );
}
