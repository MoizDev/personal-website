import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon, ThemeButton } from "@/writeup";
import { WRITEUPS } from "@/writeups/registry";
import "@/writeup/page/writeup.css";

export const metadata: Metadata = {
  title: "Writeups",
  description: "How the projects work, taken apart one piece at a time.",
};

/** Every writeup, in the order writeups/registry.ts lists them. */
export default function Page() {
  return (
    <div className="wu">
      <header className="wu-top">
        <Link href="/" className="wu-back">
          <Icon name="ArrowLeft" size={16} />
          Back
        </Link>
        <div className="wu-top-right">
          <ThemeButton />
        </div>
      </header>

      <main className="wu-article">
        <div className="wu-head">
          <h1 className="wu-title">Writeups</h1>
          <p className="wu-date">How the projects work, taken apart one piece at a time.</p>
        </div>

        <ul className="wu-index">
          {WRITEUPS.map(({ meta }) => (
            <li key={meta.slug}>
              <Link href={`/writeups/${meta.slug}`} className="wu-card">
                <Image src={meta.hero.src} alt="" sizes="(max-width: 720px) 100vw, 240px" />
                <div>
                  <p className="wu-date">
                    {meta.project}
                    <span className="wu-date-dim">{meta.date}</span>
                  </p>
                  <h2 className="wu-card-title">{meta.title}</h2>
                  <p className="wu-card-dek">{meta.dek}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
