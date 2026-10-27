import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/diagram/icons";
import { ThemeButton } from "@/components/writeup/ThemeButton";
import { WRITEUPS } from "@/lib/writeups";
import "@/components/writeup/writeup.css";

export const metadata: Metadata = {
  title: "Writeups",
  description: "How Moiz Hashmi's projects work, taken apart one piece at a time.",
  alternates: { canonical: "/writeups" },
};

/** Every writeup, newest first as listed in lib/writeups.ts. */
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
