// Single source of truth for the "drawer of thoughts" articles. Add an entry
// here and it shows up in the list, gets its own /thoughts/[slug] page, joins
// the sitemap, and plugs into the internal backlink graph (via `related` and
// inline [label](/thoughts/slug) links in the content).
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string };

export type Article = {
  slug: string;
  title: string;
  blurb: string;
  date: string;
  /** ISO date for SEO (article:published_time); falls back to `date` */
  published?: string;
  /** optional hard-coded banner; otherwise pulled from the image pool by index */
  image?: string;
  /** SEO keywords for this piece */
  keywords?: string[];
  /** slugs of related articles, rendered as backlinks at the foot of the piece */
  related?: string[];
  content: Block[];
};

export const thoughts: Article[] = [
  {
    slug: "the-seam",
    title: "the seam",
    blurb: "where applied ml meets the silicon it runs on",
    date: "2026",
    published: "2026-01-15",
    keywords: [
      "ai infrastructure",
      "applied ml",
      "cuda",
      "specialization",
      "judgment layer",
    ],
    related: ["the-judgment-layer", "depth-before-breadth", "implement-it-dont-import-it"],
    content: [
      {
        type: "p",
        text: "as code gets cheap, judgment gets scarce. so i decided to go live where it's scarcest, the exact coordinate where the people who train and use models meet the people who make the silicon sing.",
      },
      {
        type: "p",
        text: "most engineers pick a side. you're either an ml person who treats the gpu as a black box, or a systems person who's never hand-rolled a training loop. the rare, valuable thing is to be fluent in both, to read a memory model and a transformer in the same breath.",
      },
      {
        type: "quote",
        text: "you're valuable precisely where the answer can't be auto-generated.",
      },
      {
        type: "p",
        text: "that's the bet. learn the layer underneath the abstraction everyone else imports, which is really just [depth before breadth](/thoughts/depth-before-breadth) taken seriously, and the seam stops being a gap and starts being a place to stand. it's the most concrete version of living in [the judgment layer](/thoughts/the-judgment-layer).",
      },
    ],
  },
  {
    slug: "the-judgment-layer",
    title: "the judgment layer",
    blurb: "as code gets cheap, judgment gets scarce",
    date: "2026",
    published: "2026-04-02",
    keywords: ["judgment", "ai", "software engineering", "career", "specialization"],
    related: ["the-seam", "depth-before-breadth", "build-the-door"],
    content: [
      {
        type: "p",
        text: "the machine can type now. it writes the function, scaffolds the app, fills in the boilerplate that used to be most of the job. a lot of people find that scary. i think it just moved the value, it didn't delete it.",
      },
      {
        type: "p",
        text: "what got cheap is syntax. what didn't is judgment: knowing what to build, which design survives contact with scale, why one approach is taste and another is a trap. that layer sits above the code, and it's exactly the part the machine can't auto-generate, because it depends on understanding the system all the way down.",
      },
      {
        type: "quote",
        text: "ai commoditized the typing of code. it can't reach the layer above syntax.",
      },
      {
        type: "p",
        text: "you can only have taste about systems you actually understand, which is why i'm so stubborn about [depth before breadth](/thoughts/depth-before-breadth). the depth isn't nostalgia, it's what buys the judgment.",
      },
      {
        type: "p",
        text: "so the bet is simple: live in the judgment layer, where you're valuable precisely because the answer can't be generated. for me that means working at [the seam](/thoughts/the-seam), where applied ml meets the hardware it runs on and the hard questions don't have library functions.",
      },
    ],
  },
  {
    slug: "build-the-door",
    title: "build the door",
    blurb: "make work too good to ignore instead of asking to be let in",
    date: "2026",
    published: "2026-04-18",
    keywords: ["career", "networking", "portfolio", "building in public", "opportunity"],
    related: ["the-judgment-layer", "ship-the-b-plus"],
    content: [
      {
        type: "p",
        text: "networking always made me a little queasy. the cold messages, the coffee chats engineered to extract a referral, the sense that you're performing interest to get something. i'm not above it exactly, it just never sat right, and it never reliably worked for me either.",
      },
      {
        type: "p",
        text: "the alternative i keep coming back to is to build the door instead of knocking on it. make something so clearly good that it does the talking. a real artifact, public and measurable, that someone in the field sees and thinks, i want to know who made this.",
      },
      {
        type: "quote",
        text: "make work too good to ignore instead of asking to be let in.",
      },
      {
        type: "p",
        text: "this isn't a trick to avoid people, it's a better way to meet them. an artifact starts the conversation on the strongest possible footing, because the proof is already on the table. you're not asking to be believed, you've already shown the thing.",
      },
      {
        type: "p",
        text: "it only works if the work is real, which loops back to everything else: you have to actually [ship it](/thoughts/ship-the-b-plus), and it has to come from the [judgment layer](/thoughts/the-judgment-layer), where the output is hard to fake.",
      },
    ],
  },
  {
    slug: "depth-before-breadth",
    title: "depth before breadth",
    blurb: "why i go all the way down before i spread out",
    date: "2026",
    published: "2026-02-02",
    keywords: ["depth", "mastery", "first principles", "learning", "fundamentals"],
    related: ["implement-it-dont-import-it", "the-seam", "the-judgment-layer"],
    content: [
      {
        type: "p",
        text: "breadth without depth is just a wider surface to be shallow on. i go all the way down before i spread out.",
      },
      {
        type: "p",
        text: "the rule is simple: i don't move on until i can rebuild it from a blank file. not i read about it, rebuilt it. matmul by hand. backprop by hand. a kernel i actually profiled. it's the same discipline i write about in [implement it, don't import it](/thoughts/implement-it-dont-import-it).",
      },
      {
        type: "quote",
        text: "progress is gated by proof, not by the passage of time.",
      },
      {
        type: "p",
        text: "it's slower at first and then it isn't. the foundations compound, the shortcuts don't. and depth is the only thing that buys you a place at [the seam](/thoughts/the-seam), because you can only have taste about systems you understand to the floor.",
      },
    ],
  },
  {
    slug: "implement-it-dont-import-it",
    title: "implement it, don't import it",
    blurb: "the slowness is where the understanding lives",
    date: "2025",
    published: "2025-12-08",
    keywords: ["from scratch", "understanding", "craft", "learning", "fundamentals"],
    related: ["depth-before-breadth", "carry-it-out-loud", "the-most-dangerous-phrase"],
    content: [
      {
        type: "p",
        text: "you don't understand backprop until you've written it by hand. the slowness is where the understanding lives. this is the engine behind [depth before breadth](/thoughts/depth-before-breadth).",
      },
      {
        type: "p",
        text: "every abstraction you import without building is a withdrawal against future understanding. it works until it doesn't, and then you have no idea why.",
      },
      {
        type: "quote",
        text: "build it once, from scratch, badly. then the library becomes a tool you can reason about instead of magic you have to trust.",
      },
      {
        type: "p",
        text: "that's the whole discipline. own the foundational thing, and everything built on top of it stops being a mystery. if you skip it and ship anyway, you're just taking on [debt you haven't admitted yet](/thoughts/carry-it-out-loud).",
      },
    ],
  },
  {
    slug: "carry-it-out-loud",
    title: "carry it out loud",
    blurb: "debt isn't shameful. carrying it silently is",
    date: "2026",
    published: "2026-02-18",
    keywords: ["technical debt", "understanding", "honesty", "learning", "craft"],
    related: ["implement-it-dont-import-it", "the-easiest-person-to-fool"],
    content: [
      {
        type: "p",
        text: "every project i've shipped sits on top of things i didn't fully understand when i shipped them. a library i imported without reading. a pattern i copied because it worked. there's a gap between what runs and what i could rebuild, and for a while i pretended the gap wasn't there.",
      },
      {
        type: "p",
        text: "that pretending is the actual problem. the gap is just debt. debt is normal, you take it on to ship, and most useful things get built on a little of it. what turns it toxic is hiding it from yourself, because then it compounds quietly and you never schedule the repayment.",
      },
      {
        type: "quote",
        text: "debt isn't shameful. carrying it silently is.",
      },
      {
        type: "p",
        text: "so now i name it. i keep a short, honest list of the things i'm leaning on but couldn't reconstruct. then i pay it down on purpose, usually by [building the thing from scratch](/thoughts/implement-it-dont-import-it) until it stops being magic.",
      },
      {
        type: "p",
        text: "the test for whether you've actually repaid it is simple and a little brutal: close the tab and rebuild it from memory. if you can't, you were renting understanding, not owning it. more on that in [the easiest person to fool](/thoughts/the-easiest-person-to-fool).",
      },
    ],
  },
  {
    slug: "the-easiest-person-to-fool",
    title: "the easiest person to fool",
    blurb: "'i can get it working' and 'i can build it from blank' are different skills",
    date: "2026",
    published: "2026-01-28",
    keywords: [
      "retrieval practice",
      "understanding",
      "illusion of competence",
      "learning",
      "memory",
    ],
    related: ["carry-it-out-loud", "the-most-dangerous-phrase"],
    content: [
      {
        type: "p",
        text: "feynman said you are the easiest person to fool, and nowhere is that truer than when you're learning something and quietly deciding you already get it.",
      },
      {
        type: "p",
        text: "the illusion has a tell. i can get it working and i can build it from a blank file are completely different skills, and the gap between them hides in exactly the places that feel familiar. you've seen the syntax a hundred times, so your brain reports understanding, and the report is wrong.",
      },
      {
        type: "quote",
        text: "re-reading produces confidence. it does not produce understanding.",
      },
      {
        type: "p",
        text: "the only honest test i've found is retrieval. close the tab, get a blank page, and rebuild it from memory. it's uncomfortable, and the discomfort is the point: free recall is hard precisely because it's doing the work that re-reading skips.",
      },
      {
        type: "p",
        text: "so i don't trust the feeling of understanding anymore, i trust the rebuild. if i can't reconstruct it cold, i haven't learned it, i've rented it. the rented stuff is just [debt i haven't admitted yet](/thoughts/carry-it-out-loud).",
      },
    ],
  },
  {
    slug: "the-most-dangerous-phrase",
    title: "the most dangerous phrase",
    blurb: "'content i want to get through'",
    date: "2025",
    published: "2025-11-05",
    keywords: ["learning", "consumption", "tutorial hell", "producing", "focus"],
    related: ["implement-it-dont-import-it", "the-easiest-person-to-fool"],
    content: [
      {
        type: "p",
        text: "the most dangerous sentence in my own notes is content i want to get through. it sounds productive. it feels like progress. it builds almost nothing.",
      },
      {
        type: "p",
        text: "getting through a course, a playlist, a stack of problems, scratches the itch of motion without the cost of producing anything. you finish the video and feel like you learned, but learning is what happens when you make something, not when you watch someone else make it.",
      },
      {
        type: "quote",
        text: "covering content feels like progress and builds almost nothing.",
      },
      {
        type: "p",
        text: "the fix is a ratio. spend most of the hours producing and a little reading, not the reverse. a tutorial isn't a portfolio piece. going one step past the tutorial, the part nobody showed you, is the whole game. it's why i build everything i'm trying to learn at least once, the rule behind [implement it, don't import it](/thoughts/implement-it-dont-import-it).",
      },
      {
        type: "p",
        text: "consumption is also the most comfortable kind of avoidance, because it looks identical to work from the outside. the honest check is whether you could rebuild any of it with the tab closed, and most of the time you can't, which is the whole point of [the easiest person to fool](/thoughts/the-easiest-person-to-fool).",
      },
    ],
  },
  {
    slug: "ship-the-b-plus",
    title: "ship the b+",
    blurb: "the a+ in drafts loses to the b+ that's live",
    date: "2026",
    published: "2026-02-25",
    keywords: [
      "shipping",
      "perfectionism",
      "done is better than perfect",
      "execution",
      "building in public",
    ],
    related: ["fear-in-the-costume-of-diligence", "build-the-door"],
    content: [
      {
        type: "p",
        text: "i have a folder of almost finished things. essays that were one edit from done for three months. projects that worked but didn't feel polished enough to show. all of it good, all of it invisible.",
      },
      {
        type: "p",
        text: "perfectionism markets itself as high standards. usually it's procrastination with better branding. the a+ version that never ships loses, every single time, to the b+ version that's actually out in the world getting read, used, and corrected.",
      },
      {
        type: "quote",
        text: "done is better than perfect. a b+ shipped beats an a+ in drafts.",
      },
      {
        type: "p",
        text: "shipping isn't the end of the work, it's where the real feedback starts. a thing in public gets pressure-tested by reality in a way no amount of private polishing can match. and if it isn't shipped, it didn't happen, no matter how good the draft is.",
      },
      {
        type: "p",
        text: "the failure mode that feeds this is the same one that keeps me planning forever, just relocated to the finish line. both are [fear in the costume of diligence](/thoughts/fear-in-the-costume-of-diligence). the move is the same: pick the smallest shippable version and let it go.",
      },
    ],
  },
  {
    slug: "fear-in-the-costume-of-diligence",
    title: "fear in the costume of diligence",
    blurb: "over-planning is just procrastination that feels productive",
    date: "2026",
    published: "2026-03-14",
    keywords: ["procrastination", "planning", "fear", "execution", "analysis paralysis"],
    related: ["clarity-is-a-byproduct", "ship-the-b-plus"],
    content: [
      {
        type: "p",
        text: "i'm an over-planner. i can pour a genuinely impressive amount of effort into mapping a thing, re-mapping it, optimizing the order of the steps, and call it preparation. it took me a while to see that a lot of it was just fear wearing a good outfit.",
      },
      {
        type: "p",
        text: "analysis paralysis doesn't feel like avoidance from the inside. it feels responsible. it feels like rigor. that's what makes it sticky: the planning is real work, it's just real work pointed at delaying the part that scares me, which is starting something i might be bad at.",
      },
      {
        type: "quote",
        text: "analysis paralysis is just fear in the costume of diligence.",
      },
      {
        type: "p",
        text: "the cure isn't a better plan. it's a concrete next action, today, small enough that i can't talk myself out of it. once i'm moving, the planning anxiety drains, because i finally have real data instead of imagined paths. that's the whole argument in [clarity is a byproduct](/thoughts/clarity-is-a-byproduct).",
      },
      {
        type: "p",
        text: "the plan is not the work. shipping the rough version teaches me more in an afternoon than another week of mapping ever could, which is why i try to [ship the b+](/thoughts/ship-the-b-plus).",
      },
    ],
  },
  {
    slug: "clarity-is-a-byproduct",
    title: "clarity is a byproduct",
    blurb: "you don't wait to feel ready. you move, and the fog thins",
    date: "2026",
    published: "2026-03-01",
    keywords: ["clarity", "action", "decision making", "momentum", "philosophy"],
    related: ["fear-in-the-costume-of-diligence", "theres-no-behind"],
    content: [
      {
        type: "p",
        text: "for a long time i thought clarity was something you arrived at before you started. that one day the path would resolve, the doubt would lift, and then i'd be allowed to begin. so i waited. i made plans about plans. i mistook the waiting for diligence.",
      },
      {
        type: "p",
        text: "the realization that changed things was small and a little embarrassing: clarity is derived from action, not the other way around. you don't think your way to certainty and then move. you move, and the certainty shows up behind you, built one step at a time.",
      },
      {
        type: "quote",
        text: "certainty isn't a precondition. it's a byproduct.",
      },
      {
        type: "p",
        text: "the people who look like they had a clearer map didn't. they just started walking sooner, and the map filled in as they went. mine does too, every time i stop planning the route and take the next real step.",
      },
      {
        type: "p",
        text: "so when i don't know what to do now, i don't treat that as a reason to wait. i treat it as the normal condition of someone standing at a fork, which is a sign i've advanced, not that i'm lost. the trap is dressing the waiting up as work, which i wrote about in [fear in the costume of diligence](/thoughts/fear-in-the-costume-of-diligence).",
      },
    ],
  },
  {
    slug: "theres-no-behind",
    title: "there's no behind",
    blurb: "gate cleared, or not cleared yet. never late",
    date: "2025",
    published: "2025-10-12",
    keywords: ["comparison", "progress", "mastery", "anxiety", "self-measurement"],
    related: ["the-obscurity-of-greatness", "the-pace-that-survives"],
    content: [
      {
        type: "p",
        text: "i used to keep a running tally of how behind i was. behind the kid who started coding at twelve. behind the person who already shipped the thing i'm still planning. the tally was always growing, and it never once helped me write a line of code.",
      },
      {
        type: "p",
        text: "the reframe that actually worked: stop measuring against the calendar and start measuring against proof. i'm not behind because of what month it is. i'm either able to do the thing, from a blank file, or i'm not yet. that's the only status that exists.",
      },
      {
        type: "quote",
        text: "there's no behind. there's only gate cleared, or gate not cleared yet.",
      },
      {
        type: "p",
        text: "a gate has a hard, objective pass condition. rebuild it from scratch. ship it with no leaks. explain it to someone with no context. when i hold myself to that, comparison loses its grip, because the only person on the other side of the gate is me.",
      },
      {
        type: "p",
        text: "the slow truth underneath this is that everyone's progress looks obvious in hindsight and felt like fog while it happened. i got into that in [the obscurity of greatness](/thoughts/the-obscurity-of-greatness). and the way you keep clearing gates without flaming out is its own discipline, which is [the pace that survives](/thoughts/the-pace-that-survives).",
      },
    ],
  },
  {
    slug: "the-pace-that-survives",
    title: "the pace that survives",
    blurb: "the intensity i can still hold in week ten",
    date: "2025",
    published: "2025-09-22",
    keywords: ["sustainable intensity", "burnout", "consistency", "pace", "discipline"],
    related: ["theres-no-behind", "fatigue-is-a-signal"],
    content: [
      {
        type: "p",
        text: "the fantasy is the ten hour day, every day, until you've outworked everyone. i tried it. it gets you to about week three, and then you're not resting on purpose, you're collapsing, which is worse because you can't schedule it.",
      },
      {
        type: "p",
        text: "the thing that actually compounds is the pace you can hold when you're bored of holding it. hard most days, one real day off a week. not a break from the plan, part of the plan. the off day is what makes the other six possible.",
      },
      {
        type: "quote",
        text: "the fastest path isn't the most intense day. it's the intensity i can still hold in week ten.",
      },
      {
        type: "p",
        text: "this only works because i grade myself on gates cleared, not hours logged. if the measure were hours, resting would feel like falling behind. since the measure is proof, resting is just recovery, and recovery is part of the math. that idea sits right next to [there's no behind](/thoughts/theres-no-behind).",
      },
      {
        type: "p",
        text: "the plan that reaches the finish beats the heroic one that burns out before it. and most of what feels like running out of fuel isn't fuel at all, which i get into in [fatigue is a signal](/thoughts/fatigue-is-a-signal).",
      },
    ],
  },
  {
    slug: "fatigue-is-a-signal",
    title: "fatigue is a signal, not a tank",
    blurb: "you beat the wall with structure, not willpower",
    date: "2025",
    published: "2025-10-30",
    keywords: ["mental fatigue", "focus", "motivation", "discipline", "deep work"],
    related: ["the-pace-that-survives", "the-most-dangerous-phrase"],
    content: [
      {
        type: "p",
        text: "i used to treat hitting the wall as proof i was out of gas, and the only move i knew was to push harder or quit. both felt bad, and neither worked very well.",
      },
      {
        type: "p",
        text: "then i learned the wall is usually not an empty tank. mental fatigue is mostly your brain running a cost benefit calculation, and it fires hardest on open ended, ambiguous work where the payoff is unclear. it's not weakness, it's a signal about clarity.",
      },
      {
        type: "quote",
        text: "you don't beat the signal with willpower. you beat it with structure that gives it less to object to.",
      },
      {
        type: "p",
        text: "so the trick isn't to power through, it's to downshift instead of stopping. when the hardest task stalls, i don't end the day, i drop to a lower gear: building instead of theorizing, drilling instead of designing, something concrete with an obvious next move. the signal quiets because the ambiguity drops.",
      },
      {
        type: "p",
        text: "naming the output is half the fix. vague effort invites the wall, a clear small target starves it. that's also why i'm so suspicious of [the most dangerous phrase](/thoughts/the-most-dangerous-phrase), the one that hides ambiguity inside what feels like work.",
      },
    ],
  },
  {
    slug: "the-obscurity-of-greatness",
    title: "the obscurity of greatness",
    blurb: "it looks obvious in hindsight and is fog in real time, for everyone",
    date: "2025",
    published: "2025-11-20",
    keywords: ["comparison", "self-doubt", "ambition", "clarity", "process"],
    related: ["theres-no-behind", "clarity-is-a-byproduct"],
    content: [
      {
        type: "p",
        text: "greatness looks obvious in retrospect and is fog in real time, for everyone. you only ever see the polished end-state, never the path that led there.",
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
        text: "the fog doesn't lift before you move. you move, and it thins. that's the whole of [clarity is a byproduct](/thoughts/clarity-is-a-byproduct), and the reason there's [no such thing as behind](/thoughts/theres-no-behind).",
      },
    ],
  },
];

export const getThought = (slug: string) =>
  thoughts.find((t) => t.slug === slug);

export const thoughtIndex = (slug: string) =>
  thoughts.findIndex((t) => t.slug === slug);

export const getRelated = (slug: string): Article[] => {
  const a = getThought(slug);
  if (!a?.related?.length) return [];
  return a.related
    .map((s) => getThought(s))
    .filter((t): t is Article => Boolean(t));
};

export function readingTime(article: Article) {
  const words = article.content
    .map((b) => b.text)
    .join(" ")
    .split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}
