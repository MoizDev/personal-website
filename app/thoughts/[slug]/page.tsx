import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Thought } from "@/components/thoughts/Thought";
import { OG_IMAGE, SITE } from "@/lib/site";
import { getThought, thoughts } from "@/lib/thoughts";

// Every essay is prerendered from generateStaticParams, so reading params here is fine.
export const instant = false;

export function generateStaticParams() {
  return thoughts.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(props: PageProps<"/thoughts/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const a = getThought(slug);
  if (!a) return {};
  const url = `/thoughts/${a.slug}`;
  return {
    title: a.title,
    description: a.blurb,
    keywords: a.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: SITE.name,
      url,
      title: a.title,
      description: a.blurb,
      publishedTime: a.published ?? a.date,
      authors: [SITE.name],
      tags: a.keywords,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.blurb, images: [OG_IMAGE] },
  };
}

export default async function Page(props: PageProps<"/thoughts/[slug]">) {
  const { slug } = await props.params;
  const i = thoughts.findIndex((t) => t.slug === slug);
  if (i < 0) notFound();
  const prev = thoughts[i - 1] ?? null;
  const next = thoughts[i + 1] ?? null;
  return (
    <Thought
      article={thoughts[i]}
      prev={prev && { slug: prev.slug, title: prev.title }}
      next={next && { slug: next.slug, title: next.title }}
    />
  );
}
