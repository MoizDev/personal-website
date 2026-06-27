// A single "thought" / article banner. Drop a new object into the `thoughts`
// array in DrawerOfThoughts and it renders instantly — no markup needed.
export type Thought = {
  title: string;
  blurb: string;
  date: string;
  /** banner image url; falls back to a flat dark panel if omitted */
  image?: string | null;
  /** optional link — if set, the whole card becomes a link */
  href?: string;
};

export function ThoughtCard({ title, blurb, date, image, href }: Thought) {
  const className =
    "group relative block overflow-hidden bg-neutral-900 cursor-pointer";

  const content = (
    <>
      {image && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={image}
          alt=""
          loading="lazy"
          className="aspect-[16/5] w-full object-cover brightness-[0.85] transition duration-500 group-hover:scale-[1.03] group-hover:brightness-100"
        />
      )}
      {/* darken the left so the overlaid text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/5" />

      <div className="absolute bottom-0 left-0 max-w-[78%] p-6 sm:p-9">
        <h3 className="text-2xl font-bold text-white sm:text-3xl">{title}</h3>
        <p className="mt-2 text-sm text-white/70 sm:text-base">{blurb}</p>
        <p className="mt-3 text-xs text-white/45 sm:text-sm">{date}</p>
      </div>
    </>
  );

  return href ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <article className={className}>{content}</article>
  );
}
