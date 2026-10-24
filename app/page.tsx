import { CardStack } from "@/components/CardStack";

export default function Home() {
  return (
    <main className="home">
      <CardStack />

      <header className="intro">
        <h1 className="intro-name">Moiz Hashmi</h1>{" "}
        <p className="intro-bio">
          studies Computer Science at the University of Waterloo. He co-founded Factful and won Hack the North
          2026 with Bricked.
        </p>
      </header>

      <footer className="bar">
        <p className="bar-copy">&copy;2026 Moiz Hashmi</p>
        <nav className="bar-nav" aria-label="Main">
          <a href="#" aria-current="page">
            Work
          </a>
          <a href="/resume.pdf">Resume</a>
          <a href="https://github.com/MoizDev">GitHub</a>
          <a href="https://www.linkedin.com/in/moiz-ahmed-hashmi-a36670213/">LinkedIn</a>
        </nav>
        <a className="bar-mail" href="mailto:hashmoiz1546@gmail.com">
          hashmoiz1546@gmail.com
        </a>
      </footer>
    </main>
  );
}
