# Writeups

Long technical reads about a project, at `/writeups/<slug>`. Each one explains
how the thing works, taken apart from its code, with an animated figure every
few paragraphs. `/writeups` lists them all.

## Adding one

1. Make `writeups/<slug>/` with three files:
   - `meta.ts` exports `S` (the sections) and `meta` (a `WriteupMeta`, see `lib/writeups.ts`).
   - `Article.tsx` exports `Article`, the body: prose and figures, nothing else.
   - `index.tsx` re-exports both: `export { meta } from "./meta"; export { Article } from "./Article";`
2. Add it to `WRITEUPS` in `lib/writeups.ts`. The page, the index card and the
   "More writeups" footer pick it up from there.
3. Images go in `assets/writeups/<slug>/` as `.webp`, imported statically so
   Next sizes them. Keep them under about 100 KB each.
4. To link it from the home page, set `writeup: "/writeups/<slug>"` on the
   project in `lib/projects.ts`. The pulled-out card then shows "Read the writeup".

## The page

`components/writeup/WriteupPage.tsx` draws everything around the article, so
an article only writes its body.

- Top bar: Back on the left; the project's links and the theme switch on the right.
- Head: the project's name, centred, and a quiet line under it: date · occasion.
- Hero image, the full width of the column.
- Team and Overview, side by side (1 : 2), in small grey type.
- The body, in one 662px column. Figures can break out to 944px with `wide`.
- A contents list fixed at the left on wide screens (1180px and up). It starts
  with Overview, lists every section, nests level 3 under level 2, and marks the
  one you're reading. A thin progress bar runs along the top.

## Sections

`meta.ts` lists the sections in reading order. Their ids are the anchors in
the contents list.

```ts
export const S = {
  what: { id: "what-it-does", title: "What Bricked does", level: 2 },
  distill: { id: "distill", title: "Distill: make the idea buildable", level: 3 },
} as const;
```

In the article, `<Chapter s={S.what} />` is a level 2 heading and
`<Sub s={S.distill} />` a level 3 heading. Don't write `<h2>` by hand, or the
contents list won't know about it.

## Building blocks

All of these are in `components/writeup/parts.tsx`, except `Diagram`,
`Mosaic` and `Turntable`.

| Piece | Use it for |
| --- | --- |
| `<p>` | Prose. Most of the article. |
| `<Chapter s>` / `<Sub s>` | Headings, from `S`. |
| `<Diagram src title caption wide? bare? panes?>` | An animated figure from a few lines of text (see below). |
| `<Figure title caption wide? bare?>` | A numbered figure around anything else. `bare` drops the frame. |
| `<Shot src alt contain?>` | A screenshot or photo inside a `Figure`. |
| `<Pair concept built idea>` | Two images with an arrow between them: before → after. |
| `<Polaroids items>` | A few photos laid on the table, each with a label. |
| `<Mosaic items>` | A wall of tiles that each turn over from one image to another. |
| `<Turntable frames alt label?>` | Four views of one object, turning slowly. |
| `<Points>` + `<Point icon tone title>` | Two or three short points side by side, each under an icon. Three makes three columns. |
| `<Stats items>` | Big numbers with a label under each, for a before and after. Put it in a `bare` `Figure`. |
| `<Chip icon tone>` | A name in a sentence with a small icon: `<Chip icon="Cpu" tone="teal">kernel</Chip>`. |
| `<Pane kicker imgs?>` | Detail for one step of a flow, passed as `panes={{ id: <Pane …/> }}`. |
| `<Beat>` | One line set apart for weight. Use rarely. |
| `<Quote who>` | A pull quote. |
| `<Hood s>` | A quieter panel for a deeper aside, with its own entry in the contents. |

Frames are for drawn figures only. Photos, screenshots, polaroids, mosaics,
turntables and stats go in a `bare` `Figure`, since they bring their own
edges. Chat diagrams are frameless by default; pass `bare` to any other
`Diagram` to drop its frame.

Figures number themselves (Fig. 1, Fig. 2, …). Every figure gets a `title`
(a few words) and a `caption` (one or two sentences saying what to look at).

Tones: `ink`, `orange`, `blue`, `yellow`, `green`, `purple`, `teal`, `red`,
`gray`. Keep one meaning per tone in an article, such as purple for agents,
teal for the kernel and orange for the image model.

Icons are Lucide names (`Bot`, `Cpu`, `Image`) plus a few of our own
(`brick`, `GitHub`), listed in `components/diagram/icons.tsx`. An unknown name
draws a small dot, so check new ones there.

## The diagram language

`<Diagram src={…}>` takes plain text. The first line names the kind. Blank lines
and lines starting with `#` are ignored. Every diagram plays when it scrolls
into view, has a pause/replay button, and holds still for reduced motion.

Shared bits of a line: `"Label"` in double quotes, `[Icon]`, `{tone}`, and
`: note` (everything after a colon is a smaller note).

### flow: steps with arrows

```
flow
cols: 3
type "Type an idea" [MessageSquare] {orange} : “space shuttle”
plan "Plan it" [Bot] {purple} : agents write the design
build "Build it" [Cpu] {teal} : real parts, checked
type -> plan -> build
build ~> plan "retry"
```

- A node is `id "Label" [Icon] {tone} : note`.
- `a -> b` is a step, `a ~> b` is a loop back (dashed), and `a -x b` is a cut.
  A quoted label at the end names the last hop.
- `cols: n` sets the grid. `row: a b .` places nodes yourself, where `.` is an
  empty cell. Use rows when the auto grid wraps badly in the 662px column; two
  or three per row is the comfortable width.
- `play: a b c b c` sets the order the highlight walks, and `laps: 2` sets how
  many times it goes round a loop.

### chat: a conversation, typed out

```
chat
> You [User] {orange}: a dog holding an umbrella
Distiller [Wand] {orange}: A calm dog wearing a rain hat.
(the rewrite keeps the joke)
```

`>` marks the reader's side. A line in parentheses is a quiet aside.

### bars: numbers, or time ranges

```
bars
unit: s
Default {red} | 219 | the model's own choice
Medium {green} | 73 | 136 parts, 0 collisions
```

For a gantt, write ranges: `Brief | 1:00..2:30 {purple}`. Add `format: clock`
for m:ss labels, `max:` to fix the axis, and `mark: 254 "done"` for a dashed line.

### clock: a timer passing events

```
clock
to: 4:14
done: "built"
at 0:07 "Distilled" [Wand] {orange}
at 2:31 "First build" [Cpu] {teal}
```

### tune: switches flipped, a number moving

```
tune
from: 14:00
to: 4:14
label: one run
lever "Name the effort" [Gauge] {purple} : thinking set per step
```

### bricks: a side view, cells merging into bricks

```
bricks
layers: plates
mass: 7.1
w = white
k = black
row: ..ww
row: kkkk
say: "Each cell starts as a 1×1."
say: "Neighbours merge into plates."
say: "The weight sits over the base."
```

Rows are written top first, like a picture. `layers: plates` draws plates
instead of bricks. `mass:` adds the centre of mass and the verdict, Stands or
Tips over, judged against the bottom row. `say:` lines are the text under each
step. Colours: white, black, red, blue, yellow, green, grey, lightgrey, trans,
orange, tan, brown, pink.

### Also: cycle, timeline, dots

- `cycle` puts steps on a ring with a token going round (`laps:`, `center:`, `end:`).
- `timeline` is `time | "Title" [Icon] | note` per line.
- `dots` takes `count:`, `highlight:`, `label:`, `pick:` and `cols:`.

A diagram that can't be read throws a `DiagramError` naming the line, so a typo
fails `npm run build` (and shows in the dev overlay) instead of shipping a
broken figure.

## Writing

- Formal and plain. Sentences of a reasonable length, one idea each. No hype.
- Explain how it works, from the code. Name the real parts (files, models,
  numbers from runs), and say why each step exists.
- A figure every few paragraphs. If a paragraph describes a process, a flow or
  a timeline probably says it better. Then let the prose say what the figure
  can't.
- Real numbers, from real runs. When a figure simplifies, its caption says so.
- Lead each section with what it does, then how, then what it cost or taught.
