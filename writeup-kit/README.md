# Writeup kit

Long technical writeups for a Next.js site: one page per project that explains
how the project works, taken apart from its code, with an animated figure every
few paragraphs.

The kit has two halves:

- **`SKILL.md`** tells a coding agent how to make a writeup, from reading the
  project's repo to checking the finished page.
- **`kit/`** is the code: the page layout, the parts an article is written with,
  a small diagram language that turns a few lines of text into animated
  figures, the CSS, and one example writeup that uses every feature.

```
writeup-kit/
├── SKILL.md                   the process, for an agent
├── README.md                  this file: setup and reference
└── kit/                       copy its contents into your app
    ├── writeup/               the components (diagram/, page/, types.ts, index.ts)
    ├── writeups/              your writeups: registry.ts and one folder per writeup
    │   └── example/           meta.ts, Article.tsx, index.tsx, assets/
    ├── app/writeups/          the routes: /writeups and /writeups/[slug]
    └── public/writeups/       hero videos
```

The example's images and video are generated placeholders, and its project,
Ferry, is made up. Delete it once you have a writeup of your own.

## Requirements

- Next.js 15 or 16 with the App Router, React 19, TypeScript. Tested on Next 16.4.
- `lucide-react` for icons.
- No Tailwind or other CSS framework needed. The kit's CSS is scoped under
  `.wu` and doesn't change the rest of your site.

## Install

1. **Copy the code.** Copy everything inside `kit/` into your app's root, next
   to `app/`:

   ```sh
   cp -R writeup-kit/kit/. my-app/
   ```

   With a `src/` folder, copy `writeup/`, `writeups/` and `app/writeups/` into
   `src/`, and `public/writeups/` into the `public/` at the project root
   (Next always serves `public/` from the root).

2. **Install the icons.**

   ```sh
   npm install lucide-react
   ```

3. **Check the alias.** The routes and writeups import the kit as
   `@/writeup` and the list as `@/writeups/registry`. `create-next-app` sets up
   `@/*` already. If yours doesn't have it, add it to `tsconfig.json`:

   ```json
   { "compilerOptions": { "paths": { "@/*": ["./*"] } } }
   ```

   Use `["./src/*"]` with a `src/` folder. Inside `writeup/`, files import each
   other by relative path, so that folder works anywhere. If you'd rather not
   use an alias at all, change the `@/` imports in `app/writeups/`, `writeups/`
   and `writeups/example/` to relative paths; there are about ten.

4. **Load the font and the theme script** in `app/layout.tsx`. The kit reads
   Manrope from `--font-body` and falls back to the system font. The theme
   script sets light or dark before the first paint, so the page never flashes.

   ```tsx
   import type { Metadata } from "next";
   import { Manrope } from "next/font/google";
   import { THEME_SCRIPT } from "@/writeup";

   const manrope = Manrope({
     subsets: ["latin"],
     weight: ["200", "300", "400", "500", "600", "700", "800"],
     variable: "--font-body",
   });

   export const metadata: Metadata = { title: "My site" };

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en" className={manrope.variable} suppressHydrationWarning>
         <head>
           <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
         </head>
         <body>{children}</body>
       </html>
     );
   }
   ```

   `suppressHydrationWarning` is needed because the script sets
   `data-theme` on `<html>` before React loads. If your site already has a
   theme switch, have it set `data-theme="light"` or `"dark"` on `<html>` and
   skip the script. Without either, the page follows the system setting.

   If your `globals.css` sets a dark background through
   `prefers-color-scheme`, the writeup still draws its own background, so the
   two don't clash.

5. **Run it.** `npm run dev` and open `/writeups/example`.

### Optional settings

- **`Shot quality`.** Next only allows image quality 75 unless you list others.
  To use `<Shot quality={90}>`, add to `next.config.ts`:
  `images: { qualities: [75, 90] }`.
- **`cacheComponents`.** If your app turns on `cacheComponents` and the build
  complains about the dynamic route, add `export const instant = false;` to
  `app/writeups/[slug]/page.tsx`, or follow the message the build prints.
- **Links.** `WriteupPage` takes `home` (default `/`) and `index` (default
  `/writeups`) for its Back, Home and All writeups links.
- **`metadataBase`.** Each writeup uses its hero as its Open Graph image.
  Set `metadataBase: new URL("https://www.your.site")` in the
  root layout's `metadata`, using the domain the site is served from, so those
  image URLs are absolute. Without it, Next warns at build time and resolves
  them against localhost.

### Point your agents at it

Put this folder where your agents look for skills, such as
`.claude/skills/writeup/` in your repo or `~/.claude/skills/writeup/` for
Claude Code. Agents that read `AGENTS.md` can be pointed at it with a short
section:

```md
## Writeups

Project writeups live at `/writeups/<slug>`. To write one, or to change the
writeup pages, read `.claude/skills/writeup/SKILL.md` first: it covers the
process from reading the project's code to checking the finished page. The
parts and the diagram syntax are in the README.md beside it.
```

## Adding a writeup

1. Make `writeups/<slug>/` with three files:
   - `meta.ts` exports `S` (the sections) and `meta` (a `WriteupMeta`, see
     `writeup/types.ts`).
   - `Article.tsx` exports `Article`, the body: prose and figures, nothing else.
   - `index.tsx` re-exports both:
     `export { meta } from "./meta"; export { Article } from "./Article";`
2. Add it to `WRITEUPS` in `writeups/registry.ts`:

   ```ts
   import * as ferry from "./ferry";
   export const WRITEUPS: Writeup[] = [ferry, example];
   ```

   The page, the card on `/writeups` and the "More writeups" footer all read
   from that list.
3. Images go in `writeups/<slug>/assets/` as `.webp`, imported statically so
   Next knows their size. Keep each under about 100 KB. Videos go in
   `public/writeups/<slug>/`.

## The page

`writeup/page/WriteupPage.tsx` draws everything around the article:

- A top bar: Back on the left; the project's links and the light/dark switch
  on the right.
- The head: the title, centred, and a quiet line under it:
  project · date · occasion.
- The hero, the full width of the column: an image, or a muted looping video
  with the image as its poster.
- Team and Overview, side by side, in small grey type.
- The body, in one 662px column. Figures can break out to 944px with `wide`.
- A contents list fixed on the left on wide screens (1180px and up). It lists
  every section, nests level 3 under level 2, and marks the one you're reading.
  A thin progress bar in the project's `tone` runs along the top.
- A soft glow in the project's `tone` behind the top of the page.

Type is Manrope (`--font-body`). Code uses the system monospace. Polaroid
labels use `--font-display` if you set one, else Georgia.

## Sections

`meta.ts` lists the sections in reading order. Their ids are the anchors in
the contents list.

```ts
export const S = {
  what: { id: "what-it-does", title: "What Ferry does", level: 2 },
  claim: { id: "claim", title: "Claim: a lease, not a lock", level: 3 },
} as const;
```

In the article, `<Chapter s={S.what} />` is a level 2 heading and
`<Sub s={S.claim} />` a level 3 heading. Don't write `<h2>` by hand, or the
contents list won't know about it.

## Parts

Everything is imported from one place:

```tsx
import { Chapter, Code, Diagram, Figure, Shot } from "@/writeup";
```

| Part | Use it for |
| --- | --- |
| `<p>`, `<ul>`, `<code>` | Prose, short lists, and a file, field or value named inline. |
| `<Chapter s>` / `<Sub s>` | Headings, from `S`. |
| `<Diagram src title caption wide? bare? panes?>` | An animated figure from a few lines of text (see below). |
| `<Figure title caption wide? bare?>` | A numbered figure around anything else. `bare` drops the frame. |
| `<Shot src alt contain? quality?>` | A screenshot or photo inside a `Figure`. `contain` shows all of it. |
| `<Pair before after beforeAlt afterAlt beforeLabel? afterLabel? beforeIcon? afterIcon?>` | Two images with an arrow between them: before → after, idea → result. |
| `<Polaroids items>` | A few photos laid on a table, each with a label. `items: { src, alt, label }[]`. |
| `<Mosaic items>` | A wall of tiles that each turn over from one image to another. `items: { label, front, back }[]`. |
| `<Turntable frames alt label? sides?>` | Several views of one object, turning slowly. `sides` names each view. |
| `<Points>` + `<Point icon tone? title?>` | Two or three short points side by side, each under an icon. Three makes three columns. |
| `<Stats items>` | Big numbers with a label under each. `items: { value, label, tone? }[]`. Put it in a `bare` `Figure`. |
| `<Code lang label? mark? caption?>` | A short, simplified snippet with its syntax coloured (see Code). |
| `<Chip icon tone?>` | A name in a sentence with a small icon: `<Chip icon="Database" tone="teal">jobs table</Chip>`. |
| `<Pane kicker imgs?>` | Detail for one step of a flow, passed as `panes={{ id: <Pane …/> }}`. |
| `<Hood s>` | "Under the hood": a quieter panel for a deeper aside, with its own entry in the contents. |
| `<Quote who?>` | A pull quote. |
| `<Beat>` | One line set apart for weight. Use it once, if at all. |

Frames are for drawn figures. Photos, screenshots, polaroids, mosaics,
turntables and stats go in a `bare` `Figure`, since they bring their own
edges. Chat diagrams are frameless by default; pass `bare` to any other
`Diagram` to drop its frame.

Figures number themselves (Fig. 1, Fig. 2, …). Give every figure a `title`
(a few words) and a `caption` (one or two sentences saying what to look at).

**Tones** are `ink`, `orange`, `blue`, `yellow`, `green`, `purple`, `teal`,
`red` and `gray`. Keep one meaning per tone in an article, such as purple for
workers and teal for storage.

**Icons** are Lucide names (`Bot`, `Database`, `GitBranch`), plus `GitHub`.
Only the names listed in `writeup/diagram/icons.tsx` are bundled, so the page
stays small; an unknown name draws a small dot. To add one, import it from
`lucide-react` there and add it to the `LUCIDE` list.

## Code

A few lines of code sometimes say it better than a paragraph: the shape of a
record, a rule, the control flow of a loop.

```tsx
<p>A simplified version of the claim:</p>
<Code lang="ts" label="claim.ts" mark="3-4" caption="The lease ends on its own.">{`
  export async function claim(db: Db, worker: string) {
    const job = await db.oldestDue();
    job.worker = worker;
    job.leaseUntil = Date.now() + 30_000;
    return db.save(job);
  }
`}</Code>
```

- It illustrates; it isn't a copy of the repo. Cut the real code down to the
  five to fifteen lines that make the point, rename things for clarity, and
  replace the rest with `...` or a comment. Say "a simplified version" in the
  sentence before it.
- `lang`: `ts`, `js`, `tsx`, `py`, `json`, `sh`, `rkt` or `text`. A small
  highlighter in `writeup/page/highlight.ts` colours it on the server.
- `label` is a file name or short title, shown above the block with the
  language.
- `mark="2-3, 6"` lights those lines (counting from 1) in the project's tone
  and dims the rest a little.
- `caption` is a short line under it. Snippets aren't numbered.
- The shared indent and blank first and last lines are trimmed, so indent the
  code with the JSX around it. Keep lines under about 70 characters; longer ones
  scroll sideways on phones. Inside the template string, write a backtick as
  `` \` `` and `${` as `\${`.

## The diagram language

`<Diagram src={…}>` takes plain text. The first line names the kind of
diagram. Blank lines and lines starting with `#` are ignored. Every diagram
plays when it scrolls into view, has a pause/replay button above its frame on
the right, and shows its finished state, without controls, when the reader
has reduced motion turned on.

A diagram is parsed when the page is built. One that can't be read throws a
`DiagramError` naming the line, so a typo fails `npm run build` (and shows in
the dev overlay) instead of shipping a broken figure.

Most lines share these bits:

| Bit | Meaning |
| --- | --- |
| `"Label"` | Text in double quotes. Without quotes, the leftover words are the label. |
| `[Icon]` | An icon by name. |
| `{tone}` | A colour from the tone list. |
| `: note` | Everything after the first colon outside quotes is a smaller note. |

| Kind | Draws |
| --- | --- |
| `flow` | Steps with arrows: a pipeline, or a full flowchart. |
| `cycle` | Steps on a ring with a token going round. |
| `chat` | A conversation, typed out line by line. |
| `timeline` | Moments on a line, lit up in order. |
| `clock` | A timer that runs, lighting events as it passes them. |
| `bars` | Horizontal bars, or ranges on a time axis (a gantt). |
| `tune` | Switches flipped one by one, then a number moves. |
| `dots` | A field of dots with a few picked out. |

### flow: steps with arrows

```
flow
cols: 3
add "Add a job" [Send] {orange} : `ferry.add()`
keep "Keep it" [Database] {teal} : one row in Postgres
run "Run it" [Cog] {purple}
add -> keep -> run
run ~> keep "retry"
```

- A node is `id "Label" [Icon] {tone} : note`. Ids are letters, digits and `_`,
  starting with a letter.
- `a -> b` is a step, `a ~> b` a loop back (dashed), and `a -x b` a cut (the
  path that fails). Chain them: `a -> b -> c`. A quoted label at the end names
  the last hop.
- `cols: n` sets the grid (default: up to four). `row: a b .` places nodes
  yourself, one line per row, where `.` is an empty cell. Use rows when the
  automatic grid wraps badly; two or three per row is comfortable in the text
  column.
- `play: a b c b c` sets the order the highlight walks; ids may repeat to go
  round a loop. `laps: 2` sets how many times it goes round.
- `panes={{ id: <Pane kicker="…">…</Pane> }}` on the `Diagram` shows extra
  detail under the figure when the walk reaches that node. Readers can click a
  node to stop on it.

#### Flowcharts: shapes, regions and routes

Plain cards with arrows read as a list. Most flows should be charts: give
nodes a shape for what they are, group them by who does the work, and let
decisions branch.

```
flow
row: run ok .
row: wait fail stop
group "One try" [Repeat] {purple} : run ok
run <step> "Run" [Cog] {purple}
ok <decide> "Worked?" {purple}
fail <decide> "Five tries?" {orange}
wait <doc> "Wait" [Hourglass] {blue} : doubles
stop <pill> "Failed" [CircleX] {red} : `state = 'failed'`
run -> ok
ok -> fail "no"
fail -> stop "yes"
fail -> wait "no"
wait ~> run "again" @left [Repeat]
```

- A shape goes in angle brackets after the id: `id <shape> "Label" …`.

  | Shape | Use it for |
  | --- | --- |
  | `card` | The default: an icon tile over a title and note. |
  | `step` | A plain process step, tinted by its tone. |
  | `decide` | A question. Its outgoing arrows are branches; label them `"yes"`, `"no"`. Keep the label short; the note only shows on wide screens. |
  | `pill` | A start or an end. Sizes to its words. |
  | `store` | Something kept: a database, a cache, a folder of files. |
  | `doc` | A file or a written result: a report, a config. |
  | `io` | Input or output to the outside world: a request, an email sent. |
  | `round` | An actor or a model: an icon in a disc, its label below. |
  | `stack` | Many of a thing: a batch, a pool of workers. |

- `group "Label" [Icon] {tone} : a b c` shades a region behind those nodes.
  `lane "Label" {tone} : a b c` draws a full-width band with its label running
  down the left edge; use one lane per row (who does what). A line is a region
  only when every word after its colon is a node id; otherwise it's a node
  whose id happens to be `group` or `lane`.
- `@left` or `@right` at the end of an edge sends its last hop around the
  outside of the chart, with its label running along it. Use it for a loop back
  that would otherwise cross other arrows. In a chart with lanes, use `@right`:
  the lane labels sit on the left edge.
- `[Icon]` on an edge is what its token carries along the arrow
  (`add -> keep [Package]`). Without one, the token is a plain dot.
- Backticks in a label or note make a code chip. Inside `src={`…`}`, write
  them as `` \` ``, or the template string ends early and the page fails.
- Layout: a normal figure fits three columns at desktop width, a `wide` one
  four. Below 560px the chart shrinks, and edge labels too wide for a short
  arrow are dropped (the token still runs), so put the meaning in the nodes,
  not only in edge labels. Check the phone width every time.

### cycle: a ring

```
cycle
laps: 3
center: "job"
end: "idle"
claim "Claim" [Key] {teal} : oldest due job
run "Run" [Cog] {purple}
record "Record" [ClipboardList] {blue}
```

One node per line, in order round the ring. `laps:` is how many times the
token goes round (default 3). The middle shows a lap counter with `center:`
under it (default "lap"), then `end:` once the laps are done.

### chat: a conversation, typed out

```
chat
call: "Support"
> You [User] {orange}: The thumbnail never showed up.
Ada [Wrench] {teal}: I can't find a resize job for it.
(the worker had restarted mid-job)
```

`Name [Icon] {tone}: what they said`. `>` puts a line on the reader's side
(right). A line in parentheses is a quiet aside. `call: "Name"` opens with a
ringing phone before the first line.

### timeline: moments in order

```
timeline
0.0 s | "Added" [Send] {orange} | by the upload handler
30.1 s | "Lease ran out" [Timer] {red} | the worker hung
32.9 s | "Done" [Check] {green}
```

`time | "Title" [Icon] {tone} | note` per line. The time is any text.

### clock: a timer passing events

```
clock
to: 3:40
done: "clear"
at 0:05 "Batch arrives" [Inbox] {orange} : 1,200 uploads
at 3:40 "Queue empty" [Check] {green}
```

`at m:ss "What happened" …` per event. `to:` is where the clock stops (default:
the last event), `seconds:` how long it takes to run (default 7), and `done:`
a word shown when it stops.

### bars: numbers, or time ranges

```
bars
unit: ms
mark: 100 "target"
In memory {gray} | 3 | fast, and lossy
With the index {yellow} | 140
All three {green} | 35 | what runs today
```

`Label [Icon] {tone} | value | note` per row.

- `unit:` follows each value. A symbol (`s`, `%`, `/10`) sits right after the
  number. Two or more letters (`ms`, `attempts`) count as a word: it gets a
  space, and for exactly 1 it loses a final `s` ("1 attempt"). Axis ticks show
  only the number when the unit is a word.
- `max:` fixes the end of the axis (default: the largest value, or the mark
  if it's further out).
- `mark: 100 "target"` draws a dashed line across the rows.

For a gantt, write ranges instead of a value, separated by commas, each with an
optional label and tone. `format: clock` labels the axis in m:ss.

```
bars
format: clock
max: 3:40
w-1 | 0:05..1:10 {purple}, 1:12..2:30 {purple}
w-2 | 0:20..1:50 "resizes" {teal}
```

### tune: switches flipped, a number moving

```
tune
from: 4.8
to: 0.3
label: p95 wait, seconds
done: "under a second"
lever "Index on run_at" [Search] {teal} : a scan became a lookup
lever "SKIP LOCKED" [Lock] {purple}
```

Each `lever` switches on in turn, then the number rolls from `from:` to `to:`
(plain numbers or m:ss). `label:` names the number; `done:` is shown at the
end.

### dots: one in many

```
dots
count: 200
highlight: 1
cols: 25
label: "200 jobs"
pick: "1 lost"
```

`count:` dots in rows of `cols:` (default 100 in rows of 40); `highlight:` of
them light up. `label:` names the field and `pick:` the lit ones.

## Building a new kind of figure

`writeup/index.ts` also exports what the built-in figures are made from:
`useSequence` (a step counter that plays when in view, pauses, replays and
respects reduced motion), `useInView`, `useReducedMotion`, `Controls` (the
pause/replay button) and `Icon`. To add a kind, add its type and parser to
`writeup/diagram/parse.ts`, write a client component beside the others, and
add a case to `writeup/diagram/Diagram.tsx`. Its styles go in
`writeup/diagram/diagram.css`.
