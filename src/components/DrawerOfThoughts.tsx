import { ThoughtCard } from "./ThoughtCard";
import { Reveal } from "./Reveal";
import { thoughts } from "@/lib/thoughts";

export function DrawerOfThoughts({ images }: { images: string[] }) {
  return (
    <section id="thoughts" className="pt-2">
      {/* title sits just above the first notebook rule */}
      <h2 className="mt-[6.5rem] text-4xl font-normal [font-family:var(--font-serif)] sm:text-5xl">
        drawer of thoughts
      </h2>
      {/* subheading falls in the cell between the first two rules */}
      <p className="mt-5 text-lg text-[var(--muted)]">
        thoughts, observations, and learnings from the build.
      </p>

      <div className="mt-24 flex flex-col gap-6">
        {thoughts.map((t, i) => (
          <Reveal key={t.slug}>
            <ThoughtCard
              title={t.title}
              blurb={t.blurb}
              date={t.date}
              href={`/thoughts/${t.slug}`}
              image={
                t.image ?? (images.length ? images[i % images.length] : null)
              }
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
