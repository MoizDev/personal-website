import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WriteupPage } from "@/components/writeup/WriteupPage";
import { SITE } from "@/lib/site";
import { WRITEUPS, getWriteup } from "@/lib/writeups";

// Every writeup is prerendered from generateStaticParams, so reading params here
// is fine; this opts the page out of the dev-only instant-navigation check.
export const instant = false;

export function generateStaticParams() {
  return WRITEUPS.map((w) => ({ slug: w.meta.slug }));
}

export async function generateMetadata(props: PageProps<"/writeups/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const w = getWriteup(slug);
  if (!w) return {};
  const url = `/writeups/${w.meta.slug}`;
  return {
    title: `${w.meta.title}: ${w.meta.project}`,
    description: w.meta.dek,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: SITE.name,
      url,
      title: w.meta.title,
      description: w.meta.dek,
      authors: [SITE.name],
      images: [w.meta.hero.src.src],
    },
    twitter: { card: "summary_large_image", title: w.meta.title, description: w.meta.dek, images: [w.meta.hero.src.src] },
  };
}

export default async function Page(props: PageProps<"/writeups/[slug]">) {
  const { slug } = await props.params;
  // only the writeups in lib/writeups.ts exist; anything else is a 404
  const w = getWriteup(slug);
  if (!w) notFound();
  const { Article } = w;
  return (
    <WriteupPage meta={w.meta} others={WRITEUPS.filter((o) => o !== w).map((o) => o.meta)}>
      <Article />
    </WriteupPage>
  );
}
