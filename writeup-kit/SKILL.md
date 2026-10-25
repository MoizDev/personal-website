---
name: writeup
description: Write a long technical writeup of a software project for a Next.js site, reverse-engineered from the project's GitHub repo, with animated diagrams and flowcharts, real images, simplified code and a hero image or video. Use when asked to write up, explain or showcase a project as an article or blog post, or to change the writeup pages.
---

# Writing a project writeup

A writeup is one long page that explains how a project works, taken apart from
its code. It reads like a good engineering blog post: formal, plain, easy to
follow, with an animated figure every two or three paragraphs.

This folder has everything needed:

- `README.md` (beside this file): how to install the kit, every part an
  article is written with, and the full diagram syntax. Read it before writing
  an article.
- `kit/`: the code to copy into the site, with an example writeup in
  `kit/writeups/example/` that uses every part. Read its `Article.tsx` to see
  how the parts fit together. Copy its shape, not its words or placeholders.

## 0. Set up the site, once

Check whether the site already has `writeup/` and `writeups/registry.ts` (or
the same under `src/`). If not, follow Install in `README.md`: copy `kit/`'s
contents in, `npm install lucide-react`, check the `@/*` alias, and add
Manrope and the theme script to `app/layout.tsx`. Then run the site and open
`/writeups/example` to make sure it renders before you write anything.

Read the site's own `AGENTS.md` or `CLAUDE.md` too. If its Next.js version
ships docs in `node_modules/next/dist/docs/`, check them before changing
routes or config.

## 1. Read the project's code

The repo is the source of truth. The user may also give you a story about the
project (a pitch, notes, a description of the demo). Treat it as optional
context: it tells you what they care about and what happened, but every claim
about how the thing works comes from the code. Where the two disagree, follow
the code and tell the user.

- Clone the repo into a temporary folder outside the site. Read it; don't run
  it, unless the user asks you to and it's safe to.
- Start at the entry points (`main`, the server, the CLI, the app's routes),
  then follow the data: what comes in, what each stage does to it, what goes
  out. Read configs, prompts, schemas and the commit history.
- Look for what runs left behind: logs, saved outputs, galleries, timings,
  benchmarks, screenshots. That's where real numbers and real pictures come
  from.
- Keep notes as you go: each part, what it does, why it exists, the file it
  lives in, and anything surprising. Note the tricks: the clever data
  structure, the retry that saved the demo, the constraint that shaped the
  design. Those become the best sections.

## 2. Outline it, with space where the cool parts are

Write the outline as the `S` list in `meta.ts` (see Sections in `README.md`).
A shape that works:

1. What it does, in one screen.
2. Why the obvious version failed (or what made it hard).
3. How the pieces fit: one big flowchart of the whole system.
4. One section per interesting stage or idea, with level 3 subsections.
5. What the runs showed: numbers, before and after.
6. What it can't do yet.

Split the space by how interesting each part is, not by how much code it has.
The most novel mechanism gets the most words and figures, even if it's 50
lines. Setup, plumbing and boilerplate get a sentence or a single figure. A
reader should come away remembering the two or three ideas that make this
project different. Deeper technical asides go in a `Hood` so readers can skip
them.

For each section, plan its figures before its prose. Ask what the reader
should see:

| The idea is | Show it with |
| --- | --- |
| a pipeline or architecture | a `flow` flowchart with shapes, lanes and groups |
| a decision or a retry | a `flow` with a `decide` node and a `~>` loop, or a `cycle` |
| a run over time | a `clock`, a `timeline`, or a gantt in `bars` |
| a comparison | `bars`, or `Stats` in a bare `Figure` |
| an optimisation | `tune` |
| one case in many | `dots` |
| a conversation, prompt or API exchange | `chat` |
| the shape of a record or rule | a short `Code` block |
| what the thing looks like | a `Shot`, `Pair`, `Mosaic`, `Turntable` or `Polaroids` |
| a few constraints or principles | `Points` |

**Get the outline approved before writing prose.** Show the user the title
and dek, the section list with a rough share of the page for each (a
percentage or a number of paragraphs), the figures planned for each section,
and the images and hero you mean to use. Say why the biggest sections are the
biggest. Wait for their answer and fold in what they say.

## 3. Write it

Write `Article.tsx` with the parts from `README.md`. Prose is plain `<p>`.

Style:

- Formal and plain, and easy to follow. One idea per sentence; sentences of a
  reasonable length. Short paragraphs, three or four sentences at most.
- No hype or filler: no "revolutionary", "seamless", "leverage", "dive in".
  Let the mechanism be impressive on its own.
- Lead each section with what the part does, then how, then what it cost or
  taught.
- Name the real parts: files, models, libraries, numbers from runs. Say why
  each step exists.
- Define a term the first time it appears, in plain words.
- When a paragraph describes a process, a figure probably says it better.
  Draw the figure, then let the prose say what the figure can't.
- Real numbers only. When a figure simplifies, its caption says so.

Figures:

- Lots of them: a figure every two or three paragraphs. Most should be
  animated diagrams. Give each a `title` (a few words) and a `caption` (what to
  look at).
- Prefer flowcharts to plain card rows: give nodes shapes, put each actor in a
  `lane`, branch at `decide` nodes, and send loops around the outside with
  `@left` or `@right`. Put an `[Icon]` on edges so the token shows what moves.
- Use inline `<Chip>`s to name the main parts in prose, with the same icon and
  tone they have in the diagrams. Keep one meaning per tone for the whole
  article.
- Code: short, simplified snippets (five to fifteen lines) that make one
  point, introduced as "a simplified version". Use `mark` to point at the lines
  the prose is about.
- Images: real ones, from the project's repo, demo, runs or the user. Don't
  take images from other sites, and don't generate fake screenshots. Use
  photos, screenshots and before/after pairs wherever they help.

Then fill in the head of `meta.ts`: a title with some character (the project's
name goes in the line under it), a one-sentence dek, date, occasion, team,
overview, links and `tone` (the project's accent colour).

## 4. The hero, and the images

The hero sits under the title, the full width of the column. It's the first
thing a reader sees, so make it the project's best picture: the product in
use, the output, the device on the desk.

- **Image:** about 1600px wide, 16:9 or close to it.
- **Video** (better when the project moves): a short, silent clip of it
  working, 4 to 10 seconds, that loops cleanly. It plays muted and inline, with
  the hero image as its poster (the still for reduced motion and for link
  previews). Put the files in `public/writeups/<slug>/` and set
  `hero.video: { mp4: "/writeups/<slug>/hero.mp4", webm?: … }` in `meta.ts`.
  Keep it under about 3 MB:

  ```sh
  ffmpeg -i demo.mov -t 8 -an -vf "scale=1280:-2,fps=30" \
    -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart hero.mp4
  ffmpeg -i hero.mp4 -frames:v 1 hero.png   # then convert to hero.webp as below
  ```

Convert every image to `.webp`, sized for where it shows: about 1600px for the
hero, 1200px for a full-width figure, 560px for tiles. Use quality 80 to 85 and
keep each under about 100 KB. Put them in `writeups/<slug>/assets/` and import
them statically. Only keep the images the article uses.

```py
from PIL import Image
im = Image.open(src).convert("RGB")  # "RGBA" if it has transparency
if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
im.save(dest, "WEBP", quality=84, method=6)
```

Every image needs `alt` text that says what it shows.

## 5. Register it

Add the writeup to `WRITEUPS` in `writeups/registry.ts` (see Adding a writeup
in `README.md`). If the site has a projects list or home page card, link it to
`/writeups/<slug>` as the site's conventions do. Remove the example writeup
once the site has a real one, unless the user wants to keep it.

## 6. Check it

1. `npm run build`. A diagram with a typo throws a `DiagramError` naming the
   line and fails the build. Fix every error and warning the build shows.
2. `npm run lint`.
3. Start the site and take screenshots of the whole page with a headless
   browser (Playwright works well), then look at every one:
   - at 1440px wide and at 390px wide (a phone);
   - in light and in dark (set `data-theme` on `<html>`, or emulate
     `prefers-color-scheme`);
   - while figures play, and after they finish (scroll each into view and wait
     a few seconds);
   - with reduced motion on (`reducedMotion: "reduce"`): every figure should
     show its finished state with no replay controls, and the hero video
     should hold on its poster, with play controls instead of autoplay.
4. Look for labels that wrap or clip, flowcharts that wrap badly in the 662px
   column (fix with `row:`), edge labels that only make sense on desktop,
   overlapping text, missing icons (a small dot means an unknown icon name),
   images that are blurry or too heavy, and large empty gaps.
5. Read the whole article once more, top to bottom, as a reader would. Cut
   any sentence that doesn't help.

Fix what you find and screenshot again. When you hand it back, show the user
the desktop and phone screenshots and list anything you couldn't verify.
