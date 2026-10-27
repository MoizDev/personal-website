import type { Metadata } from "next";
import Link from "next/link";
import { ThoughtsFrame } from "@/components/thoughts/Thought";
import { thoughts } from "@/lib/thoughts";

export const metadata: Metadata = {
  title: "Drawer of thoughts",
  description: "Short essays by Moiz Hashmi on software craft, learning, taste and building.",
  alternates: { canonical: "/thoughts" },
};

/** Every essay, in order. Not linked from the site; it's here for old links and search. */
export default function Page() {
  return (
    <ThoughtsFrame back={{ href: "/", label: "Back" }}>
      <div className="wu-head">
        <h1 className="wu-title">Drawer of thoughts</h1>
        <p className="wu-date">Short essays on software craft, learning, taste and building.</p>
      </div>
      <ul className="th-list">
        {thoughts.map((t) => (
          <li key={t.slug}>
            <Link href={`/thoughts/${t.slug}`}>
              <span className="th-related-title">{t.title}</span>
              <span className="th-related-blurb">{t.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </ThoughtsFrame>
  );
}
