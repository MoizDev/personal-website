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
   project in `lib/projects.ts`. Clicking the pulled-out card then opens the
   writeup, and its detail shows "Read the writeup" beside the project's own link.

## Making one, start to finish

The Bricked writeup was made this way; follow the same steps for the next project.

1. **Read the project's code.** Clone it into a temporary folder outside this
   repo and read it; don't run it. Start at the entry points, then the prompts,
   configs and the commit history. Look for anything a run left behind (logs,
   galleries, timings): that's where the real numbers and pictures come from.
   Note what each part does and why it exists, with file names.
2. **Outline it in `meta.ts`.** A shape that works: what it does → why the
   obvious version failed → how the pieces fit → one section per stage → what
   the runs showed (numbers) → what it can't do yet. Put deeper asides in a
   `Hood`.
3. **Plan the figures before the prose.** For each section, ask what the
   reader should see: a pipeline is a `flow`, a retry loop a `cycle`, a run
   over time a `clock` or a gantt in `bars`, a before and after `Stats`, an
   idea and its result a `Pair`, the shape of a record or a rule a short
   `Code` snippet. Aim for a figure every two or three
   paragraphs, and give each one a `title` and a `caption` that says what to
   look at.
4. **Write the prose** (see Writing, below), then the head in `meta.ts`: a
   title with some character, a one-sentence dek, team, overview and hero.
5. **Prepare the images.** Take them from the project's own repo or runs, not
   from other sites. Convert them to `.webp` with Pillow and size each for
   where it shows: about 1600px wide for the hero, 1200px for a full-width
   figure, 560px for tiles. Use quality 80–85 and keep each under about
   100 KB. Only commit images the article uses.

   ```py
   from PIL import Image
   im = Image.open(src).convert("RGB")  # "RGBA" if it has transparency
   if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
   im.save(dest, "WEBP", quality=84, method=6)
   ```

6. **Register it and link it**: steps 2 and 4 of "Adding one".
7. **Check it.** `npm run build` (a broken diagram fails it) and
   `npm run lint`. Then open the page in a browser and look at every figure,
   at 1440px and 390px wide, in light and dark, while it plays and after it
   ends. Look for labels that wrap or clip, flows that wrap badly in the 662px
   column (fix them with `row:`), and empty space. Turn on reduced motion once:
   every figure should show its finished state with no controls. Finally,
   click the project's card on the home page and make sure it opens the
   writeup.

## The page

`components/writeup/WriteupPage.tsx` draws everything around the article, so
an article only writes its body.

- The sky: the home page's ASCII solar system, one window tall behind the top
  of the page, in the project's colour (`tone` in `meta.ts`, the same as its
  card in `lib/projects.ts`). It scrolls away with the page, fades out before
  the body, keeps clear of the title, and stops drawing once it's off screen.
  Phones show only the soft glow, as on the home page.
- Type: Manrope, the site's font everywhere (loaded once in `app/layout.tsx`
  as `--font-body`, weights 200 to 800). Code uses the system monospace.
  Libre Baskerville (`--font-display`) is only for polaroid labels.
- Top bar: Back on the left; the project's links and the theme switch on the right.
- Head: the title, centred, and a quiet line under it: project · date · occasion.
  Give it a title with some character ("Some Assembly Required"); the project's
  name is in the line under it.
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
| `<Code lang label? mark? caption?>` | A short, simplified snippet with its syntax coloured (see Code, below). |
| `<Chip icon tone>` | A name in a sentence with a small icon: `<Chip icon="Cpu" tone="teal">kernel</Chip>`. |
| `<Pane kicker imgs?>` | Detail for one step of a flow, passed as `panes={{ id: <Pane …/> }}`. |
| `<Beat>` | One line set apart for weight. Use rarely. |
| `<Quote who>` | A pull quote. |
| `<Hood s>` | A quieter panel for a deeper aside, with its own entry in the contents. |

Prose can name a file, a field or a value as inline code: `<code>brief.json</code>`.

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

## Code

Sometimes a few lines of code say it better than a paragraph: the shape of a
record, a rule, the control flow of a loop. Use `<Code>` for those.

```tsx
<p>A simplified version of the check:</p>
<Code lang="py" label="pipeline.py" mark="4-5" caption="One repair, then give up.">{`
  def build_checked(brief):
      parts, problems = build(brief)
      if problems:
          brief = repair(brief, problems)
          parts, problems = build(brief)
      return brief, parts, problems
`}</Code>
```

- It's an illustration, not a copy of the repo. Cut the real code down to the
  lines that make the point (five to fifteen), rename things for clarity, and
  replace the rest with `...` or a comment. Say "a simplified version" in the
  sentence before it.
- `lang`: `ts`, `js`, `tsx`, `py`, `json`, `sh` or `text`. Colours come from a
  small built-in highlighter (`components/writeup/highlight.ts`) that runs on
  the server.
- `label` is a file name or a short title, shown above the block with the
  language.
- `mark="2-3, 6"` lights those lines (counting from 1) in the project's colour
  and dims the rest a little. Use it to point at the one or two lines the
  prose is about.
- `caption` is a short line under it. It isn't numbered; snippets aren't
  figures.
- The source's shared indent and blank first and last lines are trimmed, so
  indent it with the JSX around it. Long lines scroll sideways on phones; keep
  them under about 70 characters.

## The diagram language

`<Diagram src={…}>` takes plain text. The first line names the kind. Blank lines
and lines starting with `#` are ignored. Every diagram plays when it scrolls
into view, has its pause/replay button (and any badge, like "Round 1") in a
row above its frame, on the right, and holds still for reduced motion.

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

#### Flowcharts: shapes, regions and routes

Plain cards with arrows read as a list. Most flows should be charts: give
nodes a shape for what they are, group them by who does the work, and let
decisions branch.

```
flow
row: assemble check .
row: repair problems ok
group "Kernel" {teal} : assemble check repair problems
assemble <step> "Assemble" [Puzzle] {teal} : cells to real parts
check <step> "Check" [ListChecks] {teal}
problems <decide> "Any problems?" {orange}
repair <round> "Repair" [Wrench] {purple}
ok <pill> "Publish it" [Check] {green} : `.ldr`, brief, report
assemble -> check -> problems
problems -> ok "no"
problems -> repair "yes"
repair ~> assemble "rebuild" @left [Wrench]
```

- A shape goes in angle brackets after the id: `id <shape> "Label" …`.

  | Shape | Use it for |
  | --- | --- |
  | `card` | The default, a card with an icon, title and note. |
  | `step` | A plain process step, tinted by its tone. |
  | `decide` | A question. Its outgoing arrows are branches; label them `"yes"`, `"no"`. Keep the label short; the note only shows on wide screens. |
  | `pill` | A start or an end. Sizes to its words. |
  | `store` | Something kept: a database, a cache, a folder of runs. |
  | `doc` | A file or a written result: a brief, a manual. |
  | `io` | Input or output to the outside: a prompt, a list sent to a shop. |
  | `round` | An actor or a model: an icon in a disc, its label below. |
  | `stack` | Many of a thing: every round, four views. |

- `group "Label" [Icon] {tone} : a b c` shades a region behind those nodes.
  `lane "Label" {tone} : a b c` makes a full-width band with the label running
  down its left edge; use one lane per row of the chart (who does what). A line
  is a region only when every word after its colon is a node id; anything else
  is a node with a note.
- `@left` or `@right` at the end of an edge sends its last hop around the
  outside of the chart, with the label running along it. Use it for a loop
  back that would otherwise cross other arrows.
- `[Icon]` on an edge is what its token carries as it runs along the arrow
  (`a -> b [Boxes]`). Without one the token is a plain dot.
- Backticks in a label or note make a code chip. Inside `src={`…`}` write
  them as `` \` ``, or the template literal ends early and the page fails.
- Layout: a normal figure fits three columns at desktop width, a `wide` one
  four. Below 560px the chart shrinks; labels too wide for a short arrow are
  dropped there (the token still runs), so put the meaning in the nodes, not
  only in edge labels. Check the phone width every time.

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
