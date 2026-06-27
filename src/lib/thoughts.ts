// Single source of truth for the "drawer of thoughts" articles. Add an entry
// here and it shows up in the list AND gets its own /thoughts/[slug] page.
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string };

export type Article = {
  slug: string;
  title: string;
  blurb: string;
  date: string;
  /** optional hard-coded banner; otherwise pulled from the image pool by index */
  image?: string;
  content: Block[];
};

export const thoughts: Article[] = [
  {
    slug: "the-seam",
    title: "the seam",
    blurb: "where applied ml meets the silicon it runs on",
    date: "2026",
    content: [
      {
        type: "p",
        text: "as code gets cheap, judgment gets scarce. so i decided to go live where it's scarcest — the exact coordinate where the people who train and use models meet the people who make the silicon sing.",
      },
      {
        type: "p",
        text: "most engineers pick a side. you're either an ml person who treats the gpu as a black box, or a systems person who's never hand-rolled a training loop. the rare, valuable thing is to be fluent in both — to read a memory model and a transformer in the same breath.",
      },
      {
        type: "quote",
        text: "you're valuable precisely where the answer can't be auto-generated.",
      },
      {
        type: "p",
        text: "that's the bet. learn the layer underneath the abstraction everyone else imports, and the seam stops being a gap and starts being a place to stand.",
      },
    ],
  },
  {
    slug: "depth-before-breadth",
    title: "depth before breadth",
    blurb: "why i go all the way down before i spread out",
    date: "2026",
    content: [
      {
        type: "p",
        text: "breadth without depth is just a wider surface to be shallow on. i go all the way down before i spread out.",
      },
      {
        type: "p",
        text: "the rule is simple: i don't move on until i can rebuild it from a blank file. not 'i read about it' — rebuilt it. matmul by hand. backprop by hand. a cuda kernel i actually profiled.",
      },
      {
        type: "quote",
        text: "progress is gated by proof, not by the passage of time.",
      },
      {
        type: "p",
        text: "it's slower at first and then it isn't. the foundations compound; the shortcuts don't.",
      },
    ],
  },
  {
    slug: "the-obscurity-of-greatness",
    title: "the obscurity of greatness",
    blurb: "it looks obvious in retrospect and is fog in real time — for everyone",
    date: "2025",
    content: [
      {
        type: "p",
        text: "greatness looks obvious in retrospect and is fog in real time — for everyone. you only ever see the polished end-state, never the path that led there.",
      },
      {
        type: "p",
        text: "so comparison is a trap. you're measuring your behind-the-scenes against someone else's highlight reel and concluding you're behind. their certainty was derived from action, the same way yours will be.",
      },
      {
        type: "quote",
        text: "clarity is derived from action, not the other way around.",
      },
      {
        type: "p",
        text: "the fog doesn't lift before you move. you move, and it thins.",
      },
    ],
  },
  {
    slug: "implement-it-dont-import-it",
    title: "implement it, don't import it",
    blurb: "the slowness is where the understanding lives",
    date: "2025",
    content: [
      {
        type: "p",
        text: "you don't understand backprop until you've written it by hand. the slowness is where the understanding lives.",
      },
      {
        type: "p",
        text: "every abstraction you import without building is a withdrawal against future understanding. it works until it doesn't, and then you have no idea why.",
      },
      {
        type: "quote",
        text: "build it once, from scratch, badly — then the library becomes a tool you can reason about instead of magic you have to trust.",
      },
      {
        type: "p",
        text: "that's the whole discipline. own the foundational thing, and everything built on top of it stops being a mystery.",
      },
    ],
  },
];

export const getThought = (slug: string) =>
  thoughts.find((t) => t.slug === slug);

export const thoughtIndex = (slug: string) =>
  thoughts.findIndex((t) => t.slug === slug);

export function readingTime(article: Article) {
  const words = article.content
    .map((b) => b.text)
    .join(" ")
    .split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}
