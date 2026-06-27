import { notFound } from "next/navigation";
import { Article } from "@/components/Article";
import { thoughtImages } from "@/lib/images";
import { thoughts, getThought, thoughtIndex } from "@/lib/thoughts";

export function generateStaticParams() {
  return thoughts.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getThought(slug);
  return {
    title: article ? `${article.title} — moiz hashmi` : "drawer of thoughts",
    description: article?.blurb,
  };
}

export default async function ThoughtPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getThought(slug);
  if (!article) notFound();

  const idx = thoughtIndex(slug);
  // same pool + index as the list, so the banner matches the card
  const image =
    article.image ?? thoughtImages[idx % thoughtImages.length] ?? null;

  const prev = idx > 0 ? thoughts[idx - 1] : null;
  const next = idx < thoughts.length - 1 ? thoughts[idx + 1] : null;

  return (
    <Article
      article={article}
      image={image}
      prev={prev && { slug: prev.slug, title: prev.title }}
      next={next && { slug: next.slug, title: next.title }}
    />
  );
}
