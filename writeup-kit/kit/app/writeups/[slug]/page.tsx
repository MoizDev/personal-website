import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WriteupPage } from "@/writeup";
import { WRITEUPS, getWriteup } from "@/writeups/registry";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return WRITEUPS.map((w) => ({ slug: w.meta.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const w = getWriteup(slug);
  if (!w) return {};
  return {
    title: w.meta.title,
    description: w.meta.dek,
    openGraph: { title: w.meta.title, description: w.meta.dek, images: [w.meta.hero.src.src] },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const w = getWriteup(slug);
  if (!w) notFound();
  const { Article } = w;
  return (
    <WriteupPage meta={w.meta} others={WRITEUPS.filter((o) => o !== w).map((o) => o.meta)}>
      <Article />
    </WriteupPage>
  );
}
