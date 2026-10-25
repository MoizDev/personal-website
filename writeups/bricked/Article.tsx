import { S } from "./meta";
import { Diagram } from "@/components/diagram/Diagram";
import { Mosaic, type MosaicItem } from "@/components/writeup/Mosaic";
import { Beat, Chapter, Chip, Code, Figure, Pair, Pane, Point, Points, Polaroids, Shot, Stats, Sub } from "@/components/writeup/parts";
import { Turntable } from "@/components/writeup/Turntable";

import app3d from "@/assets/writeups/bricked/app-3d.webp";
import appSteps from "@/assets/writeups/bricked/app-steps.webp";
import appTape from "@/assets/writeups/bricked/app-tape.webp";
import appPhoneBuy from "@/assets/writeups/bricked/app-phone-buy.webp";
import shuttleConcept from "@/assets/writeups/bricked/shuttle-concept.webp";
import shuttleSide from "@/assets/writeups/bricked/shuttle-concept-side.webp";
import shuttleBack from "@/assets/writeups/bricked/shuttle-concept-back.webp";
import shFront from "@/assets/writeups/bricked/shuttle-front.webp";
import shRight from "@/assets/writeups/bricked/shuttle-right.webp";
import shBack from "@/assets/writeups/bricked/shuttle-back.webp";
import shLeft from "@/assets/writeups/bricked/shuttle-left.webp";
import hbFront from "@/assets/writeups/bricked/hummingbird-front.webp";
import hbRight from "@/assets/writeups/bricked/hummingbird-right.webp";
import hbBack from "@/assets/writeups/bricked/hummingbird-back.webp";
import hbLeft from "@/assets/writeups/bricked/hummingbird-left.webp";

import cat from "@/assets/writeups/bricked/gallery/cat.webp";
import catBuilt from "@/assets/writeups/bricked/gallery/cat-built.webp";
import penguin from "@/assets/writeups/bricked/gallery/a-penguin.webp";
import penguinBuilt from "@/assets/writeups/bricked/gallery/a-penguin-built.webp";
import lighthouse from "@/assets/writeups/bricked/gallery/red-lighthouse-with-blue-windows.webp";
import lighthouseBuilt from "@/assets/writeups/bricked/gallery/red-lighthouse-with-blue-windows-built.webp";
import bus from "@/assets/writeups/bricked/gallery/yellow-school-bus.webp";
import busBuilt from "@/assets/writeups/bricked/gallery/yellow-school-bus-built.webp";
import goose from "@/assets/writeups/bricked/gallery/canadian-goose.webp";
import gooseBuilt from "@/assets/writeups/bricked/gallery/canadian-goose-built.webp";
import tractor from "@/assets/writeups/bricked/gallery/a-red-tractor.webp";
import tractorBuilt from "@/assets/writeups/bricked/gallery/a-red-tractor-built.webp";
import frog from "@/assets/writeups/bricked/gallery/frog.webp";
import frogBuilt from "@/assets/writeups/bricked/gallery/frog-built.webp";
import knight from "@/assets/writeups/bricked/gallery/chess-piece-knight.webp";
import knightBuilt from "@/assets/writeups/bricked/gallery/chess-piece-knight-built.webp";
import rover from "@/assets/writeups/bricked/gallery/mars-rover.webp";
import roverBuilt from "@/assets/writeups/bricked/gallery/mars-rover-built.webp";
import sumo from "@/assets/writeups/bricked/gallery/sumo-wrestler.webp";
import sumoBuilt from "@/assets/writeups/bricked/gallery/sumo-wrestler-built.webp";
import sahur from "@/assets/writeups/bricked/gallery/tung-tung-tung-sahur.webp";
import sahurBuilt from "@/assets/writeups/bricked/gallery/tung-tung-tung-sahur-built.webp";
import truck from "@/assets/writeups/bricked/gallery/a-small-truck.webp";
import truckBuilt from "@/assets/writeups/bricked/gallery/a-small-truck-built.webp";

const GALLERY: MosaicItem[] = [
  { idea: "A cat", concept: cat, built: catBuilt },
  { idea: "A penguin", concept: penguin, built: penguinBuilt },
  { idea: "A red lighthouse with blue windows", concept: lighthouse, built: lighthouseBuilt },
  { idea: "A yellow school bus", concept: bus, built: busBuilt },
  { idea: "A Canadian goose", concept: goose, built: gooseBuilt },
  { idea: "A red tractor", concept: tractor, built: tractorBuilt },
  { idea: "A frog", concept: frog, built: frogBuilt },
  { idea: "A chess knight", concept: knight, built: knightBuilt },
  { idea: "A Mars rover", concept: rover, built: roverBuilt },
  { idea: "A sumo wrestler", concept: sumo, built: sumoBuilt },
  { idea: "Tung Tung Tung Sahur", concept: sahur, built: sahurBuilt },
  { idea: "A small truck", concept: truck, built: truckBuilt },
];

export function Article() {
  return (
    <>
      {/* ───────────────────────── hook ───────────────────────── */}
      <p className="wu-lede">
        Type “space shuttle” into Bricked. Four minutes and fourteen seconds later you have a model made of 141 real
        Lego parts that hold together and stand up on their own, a step-by-step manual, and a button that orders the
        pieces.
      </p>
      <p>
        We built Bricked over one weekend at Hack the North 2026, and it won. This writeup takes the system apart,
        piece by piece, from the code in our repository: what each step does, why it is there, and what we measured
        along the way.
      </p>

      <Figure bare title="One run, start to finish" caption="Left: the picture the image model imagined. Right: the model the kernel built from the agents' plan.">
        <Pair concept={shuttleConcept} built={shFront} idea="space shuttle" />
      </Figure>

      {/* ───────────────────────── 1 · What it does ───────────────────────── */}
      <Chapter s={S.what} />
      <p>
        Bricked is a web app with one text box. You describe anything (a frog, a Mars rover, a sumo wrestler) and it
        designs a Lego model of it from parts that really exist. When the design is done, you can turn it around in 3D,
        follow the instructions one step at a time, change it in plain words, and buy the bricks.
      </p>

      <Diagram
        title="From a sentence to a box of bricks"
        caption="What a person sees. Everything between the first card and the last is automatic."
        src={`
flow
row: type manual order
row: imagine plan build
lane "You" [User] {orange} : type manual order
lane "Bricked" [Sparkles] {purple} : imagine plan build
type <pill> "Type an idea" [MessageSquare] {orange} : “space shuttle”
imagine <step> "Imagine it" [Image] {orange} : a picture of the set
plan <step> "Plan it" [Bot] {purple} : agents write the design
build <step> "Build it" [Cpu] {teal} : real parts, checked
manual <doc> "Follow the steps" [BookOpen] {blue} : a manual, page by page
order <pill> "Order the parts" [ShoppingCart] {green} : a BrickLink list
type -> imagine [MessageSquare]
imagine -> plan -> build
build -> manual [Boxes]
manual -> order
`}
      />

      <Figure bare title="The finished model" caption="The 3D view. The slider at the bottom walks through the build steps; the button beside it saves the model.">
        <Shot src={app3d} alt="A red Lego car with a black roof in Bricked's 3D viewer, with a step slider underneath." />
      </Figure>

      {/* ───────────────────────── 2 · Blobs ───────────────────────── */}
      <Chapter s={S.blobs} />
      <p>
        The first version asked language models to place the bricks themselves. The repository keeps it as pipeline
        A: a planner splits the object into bands of layers, a builder agent places each band&rsquo;s bricks on a 20 ×
        20 × 20 grid, a code inspector checks them, and a vision critic scores a render of the result.
      </p>

      <Diagram
        title="Pipeline A: agents place the bricks"
        caption="A sound loop with one weak link: the builder had to hold the whole model in its head."
        src={`
flow
row: plan builder
row: critic inspect
laps: 2
play: plan builder inspect builder inspect critic
plan <round> "Planner" [Brain] {purple} : splits it into bands of layers
builder <round> "Builder" [Bot] {purple} : places one band's bricks
inspect <decide> "Overlaps or gaps?" [ListChecks] {teal} : one retry if so
critic <round> "Vision critic" [Eye] {purple} : scores a render, 0 to 10
plan -> builder
builder -> inspect [brick]
inspect ~> builder "yes"
inspect -> critic "no"
`}
      />

      <p>
        Every part of that loop worked except the one that mattered. A language model is good at deciding that a
        flower needs a pot, a stem and petals. It is poor at remembering that a brick it wrote forty lines ago already
        fills the spot it is about to use. The bricks overlapped, floated, or bunched together, and the models came out
        as blobs.
      </p>
      <p>
        So the rule was turned around, and the rest of the system follows from it.
      </p>

      <Beat>Models decide what to build. Code places every brick.</Beat>

      <p>
        Pipeline B put that rule into practice: the model writes a short design brief, and code turns it into real
        parts. Pipeline C, which the app runs today, keeps B&rsquo;s kernel and adds the parts of A that worked: a
        stability check, a fast model for small steps and a strong one for design, live streaming to the screen, and
        a firm ban on silent fallbacks. (For a while, every failed run quietly returned a cube.)
      </p>

      <Diagram
        title="Three pipelines"
        caption="A and B were built side by side and compared on the same ideas. C merges the best of both."
        src={`
flow
row: a . b
row: . c .
a <step> "Pipeline A" [Bot] {red} : agents place bricks, layer by layer
b <step> "Pipeline B" [Cpu] {teal} : agents write a brief, code places parts
c <pill> "Pipeline C" [Sparkles] {green} : what the app runs today
a -> b "flip the rule"
a -> c "what worked"
b -> c "the kernel"
`}
      />

      {/* ───────────────────────── 3 · Architecture ───────────────────────── */}
      <Chapter s={S.map} />
      <p>
        Bricked has three layers. In the browser, a <Chip icon="Monitor" tone="blue">Next.js app</Chip> takes the idea
        and draws the model. In the middle, a small <Chip icon="Server" tone="gray">Python server</Chip> starts runs
        and streams their progress. Underneath, the <Chip icon="Repeat" tone="purple">pipeline</Chip> calls the models
        and the kernel and writes everything it makes to disk.
      </p>

      <Diagram
        wide
        title="How the pieces fit"
        caption="Click any box for what it does. The arrow back to the app is the live stream."
        panes={{
          app: (
            <Pane kicker="Web app · Next.js">
              The create screen, the 3D viewer, the step-by-step manual, the parts list and the editor. The viewer is
              a Three.js renderer for LDraw, the open file format for Lego models, so the browser draws the same file
              the kernel writes.
            </Pane>
          ),
          server: (
            <Pane kicker="Server · Python">
              Starts a run for each idea and forwards its events to the browser as server-sent events. It is also
              where the run waits, for up to three minutes, for you to pick a design.
            </Pane>
          ),
          engine: (
            <Pane kicker="Pipeline · about 1,250 lines">
              The harness itself: distill, imagine, plan, build, judge. Every step that leaves a model behind raises an
              error if it fails, rather than returning a stand-in.
            </Pane>
          ),
          models: (
            <Pane kicker="Models">
              Claude Opus writes and critiques designs; Claude Sonnet does the quick rewrites and repairs. An image
              model (OpenAI&rsquo;s gpt-image-1) draws the concept art. Claude is called through the API when a key is
              set, or through the command-line tool from an empty folder when it isn&rsquo;t.
            </Pane>
          ),
          kernel: (
            <Pane kicker="Geometry kernel · milliseconds">
              Turns a brief into real parts and checks them: no overlaps, everything connected, and the model stands
              up. Every part size in it was measured from the LDraw library, never guessed.
            </Pane>
          ),
          runs: (
            <Pane kicker="Runs on disk">
              One folder per run: the concept art, every brief, every built round as an LDraw file, the renders, the
              tape of everything that happened, and a record of the best round. The folder is also the cache.
            </Pane>
          ),
        }}
        src={`
flow
row: . app .
row: . server runs
row: models engine kernel
lane "Browser" [Monitor] {blue} : app
lane "Server" [Server] {gray} : server runs
lane "Pipeline" [Repeat] {purple} : models engine kernel
play: app server engine models engine kernel runs app
app <step> "Web app" [Monitor] {blue} : Next.js and a 3D viewer
server <step> "Server" [Server] {gray} : starts runs, streams events
engine <stack> "Pipeline" [Repeat] {purple} : the harness
models <round> "Models" [Bot] {purple} : Claude and an image model
kernel <step> "Kernel" [Cpu] {teal} : places and checks parts
runs <store> "Runs" [Database] {gray} : art, briefs, models, tape
app -> server "idea" [MessageSquare]
server -> engine
engine -> models "prompts" [MessageSquare]
engine -> kernel "brief" [FileText]
kernel -> runs "model" [Boxes]
runs ~> app "live" @right [Radio]
`}
      />

      {/* ───────────────────────── 4 · The harness ───────────────────────── */}
      <Chapter s={S.harness} />
      <p>
        The harness is the loop that turns an idea into a checked model. It divides the work by what each part is good
        at.
      </p>

      <Points>
        <Point icon="Image" tone="orange" title="Image models imagine">
          They have seen more Lego than anyone alive, so they draw the finished set.
        </Point>
        <Point icon="Bot" tone="purple" title="Claude agents design">
          They decide which pieces make a wing, which colours to use, and what attaches to what.
        </Point>
        <Point icon="Cpu" tone="teal" title="The kernel places">
          Putting a brick in exactly the right place is arithmetic, not judgement, so code does it.
        </Point>
      </Points>
      <p>
        It works the way a person builds. Asked for a Lego flamingo, you would picture a flamingo first, then place a
        few bricks, compare them with the picture in your head, and fix what looks wrong. The harness runs that same
        loop, with the picture made real.
      </p>

      <Diagram
        wide
        title="The harness, step by step"
        caption="Eight steps and one loop, replaying the space shuttle run. Click a step to stop there."
        panes={{
          distill: (
            <Pane kicker="Distill · 0:07">
              The idea becomes something the kit can build: a shuttle on a clear display stand, with no fuel tank or
              boosters, and five signature features to get right.
            </Pane>
          ),
          concept: (
            <Pane kicker="Imagine · 0:44" imgs={[shuttleConcept]}>
              An image model draws the concept as a studio photo of an official Lego set. Every later step is checked
              against this picture.
            </Pane>
          ),
          views: (
            <Pane kicker="More angles · 1:15" imgs={[shuttleSide, shuttleBack]}>
              The same picture goes back in to get the side and the back, drawn while the designer is already at
              work.
            </Pane>
          ),
          spec: (
            <Pane kicker="Plan · 2:05">
              The designer agent writes the brief: nine sub-assemblies on a five-colour palette, joined by a hinge and
              nine side studs. Not one coordinate.
            </Pane>
          ),
          assemble: (
            <Pane kicker="Assemble · milliseconds">
              The kernel turns each sub-assembly into real plates and bricks and joins them at their connectors: 128
              parts.
            </Pane>
          ),
          check: (
            <Pane kicker="Check">
              Three slivers trimmed, zero collisions, and the centre of mass sits over the stand&rsquo;s base, so it
              stands.
            </Pane>
          ),
          render: (
            <Pane kicker="Render" imgs={[shFront, shRight, shBack, shLeft]}>
              Four angles of the build, from the app&rsquo;s own 3D viewer in a headless browser.
            </Pane>
          ),
          critique: (
            <Pane kicker="Critique · 2/10, then 3/10">
              The critic compares the renders with the concept: “no vertical tail fin”, “no engine nozzles”. The
              designer patches the fuselage and two engines, and the kernel rebuilds. Round two has 141 parts. Done at
              4:14.
            </Pane>
          ),
        }}
        src={`
flow
cols: 4
laps: 2
row: distill concept views spec
row: assemble check render critique
play: distill concept views spec assemble check render critique spec assemble check render critique
distill <step> "Distill" [Wand] {orange} : make it buildable
concept <step> "Imagine" [Image] {orange} : the finished set
views <stack> "More angles" [ScanEye] {orange} : side and back
spec <doc> "Plan" [Bot] {purple} : agents write the brief
assemble <step> "Assemble" [Puzzle] {teal} : brief to real parts
check <step> "Check" [ListChecks] {teal} : overlaps, stability
render <stack> "Render" [Camera] {blue} : four angles
critique <round> "Critique" [Eye] {purple} : score against the picture
distill -> concept -> views -> spec -> assemble -> check -> render -> critique
critique ~> spec "patch" [Pencil]
`}
      />

      {/* 4a · Distill */}
      <Sub s={S.distill} />
      <p>
        Many ideas can&rsquo;t be built as stated. A dog holding an umbrella needs a paw that grips a thin pole at an
        angle, and no part in the kit does that. So the first call rewrites the idea before anything is drawn. Its
        instruction fits in five words: keep the joke, drop the physics.
      </p>

      <Diagram
        title="Keep the joke, drop the physics"
        caption="The distiller's own example. A calm pose, chunky shapes, and props worn rather than held."
        src={`
chat
> You [User] {gray}: a dog holding an umbrella
Distiller [Wand] {orange}: A sitting dog wearing a small red umbrella hat.
( same joke, and every part of it can be built )
`}
      />

      <p>
        The distiller returns a small structured record: the subject, a one-line concept, three to five signature
        features, the simplifications it made, and the exact prompt for the image model. For the shuttle it chose
        “chunky delta wings”, “a rounded white nose” and “three round engine nozzles at the rear”, and it simplified
        away the fuel tank and boosters by putting the orbiter on a tilted display stand.
      </p>
      <p>
        This is a rewrite, not a design problem, so it runs on the fast model with thinking switched off. It is the
        cheapest step in the run.
      </p>

      <Diagram
        title="What the distiller hands on"
        caption="Four outputs. The features become the checklist the designer and the critic both work from."
        src={`
flow
row: idea distill concept
row: features cuts prompt
play: idea distill concept features cuts prompt
idea <pill> "“space shuttle”" [MessageSquare] {gray}
distill <round> "Distill" [Wand] {orange} : fast model, no thinking
concept <doc> "Concept" [Rocket] {orange} : a chunky orbiter on a stand
features <doc> "Five features" [ListChecks] {purple} : nose, delta wings, nozzles
cuts <step> "Simplifications" [Scissors] {gray} : no fuel tank, no boosters
prompt <io> "Image prompt" [Image] {orange} : an official Lego set photo
idea -> distill -> concept
distill -> features
distill -> cuts
distill -> prompt
`}
      />

      {/* 4b · Imagine */}
      <Sub s={S.imagine} />
      <p>
        Next, an image model draws the distilled concept as “a studio product photo of an official LEGO set”. This
        picture is the reference for the rest of the run. The designer builds from it, and the critic judges against
        it.
      </p>
      <p>
        It changes the task completely. A language model asked to build a hummingbird from words alone has to invent
        every proportion: how long the beak is, how high the wings sit, which greens to use. Given a photo, it only
        has to read them off.
      </p>

      <Figure bare title="Three views of one shuttle" caption="The concept, then the side and the back, drawn with the first picture attached so the design stays the same.">
        <Polaroids
          items={[
            { src: shuttleConcept, alt: "The image model's concept of a Lego space shuttle on a clear stand.", label: "Concept · 0:44" },
            { src: shuttleSide, alt: "The same shuttle seen from the side.", label: "Side · 1:15" },
            { src: shuttleBack, alt: "The same shuttle seen from the back.", label: "Back · 1:15" },
          ]}
        />
      </Figure>

      <p>
        One photo hides the back and the far side, so the harness asks for two more views. They are drawn on a
        background thread while the designer is already writing the brief from the front view. The critic, which runs
        later, gets all three. If a view fails, the run loses some depth, not the whole run. And if you draw a sketch
        in the app, your sketch takes the concept&rsquo;s place, and the harness designs toward your drawing instead.
      </p>

      <Diagram
        title="The shuttle run, on a clock"
        caption="Real timings from the run's tape. The views are drawn in the shadow of the brief, so they cost no time."
        src={`
bars
format: clock
max: 260
mark: 254 "done"
Distill | 0..7 {orange}
Concept art | 7..44 {orange}
Side and back | 44..75 {orange}
Brief | 44..125 {purple}
Render and critique | 125..145 {blue}
Revise | 145..220 {purple}
Rebuild and critique | 220..236 {blue}
`}
      />

      {/* 4c · Plan */}
      <Sub s={S.plan} />
      <p>
        With the pictures in hand, the designer agent (Claude Opus, thinking at medium effort) writes a build brief.
        The brief is the agents&rsquo; entire vocabulary, and it is small on purpose. It never contains a position in
        space, and it never names the bricks in a wall.
      </p>
      <p>
        A brief describes the model as a tree of <strong>bodies</strong>. Each body has its own small grid, one stud
        wide and one plate tall per cell, and says which cells are filled and in which colour. Bodies attach to each
        other only through real Lego connectors.
      </p>
      <p>
        A simplified piece of the shuttle&rsquo;s brief: the stand, two of its layers, and the hinge that carries the
        fuselage. Each row is a line of cells, one letter per colour.
      </p>

      <Code
        lang="json"
        label="brief-r1.json"
        mark="11-12"
        caption="The palette maps letters to Lego colours (47 is clear). The hinge sits on one cell of the column and tilts the fuselage by 10°."
      >{`
        {
          "palette": { "w": 15, "k": 0, "c": 47 },
          "root": "stand",
          "bodies": [
            { "name": "stand",
              "layers": [
                ["cccc", "cccc", "cccc", "cccc"],
                ["....", ".cc.", ".cc.", "...."]
              ],
              "connectors": [
                { "part": "3937", "kind": "hinge", "at": [1, 8, 1],
                  "attach": [{ "body": "fuselage", "angle": -10 }] }
              ] },
            { "name": "fuselage", "layers": [ ... ] }
          ]
        }
      `}</Code>

      <Points>
        <Point icon="RotateCcw" tone="teal" title="Hinge brick">
          Turns the body above it by a set angle. Used for wings, tails and tilted display stands.
        </Point>
        <Point icon="Magnet" tone="teal" title="Side stud">
          A brick with a stud on its side, so a body can face outward. Used for faces, windows and anything that sticks
          out sideways.
        </Point>
      </Points>
      <p>
        Small details (round tiles for eyes, a bar for a beak, wheels on a pin plate) sit on those connectors. A whole
        model uses two to five colours and 60 to 250 parts.
      </p>

      <Diagram
        title="The shuttle's brief"
        caption="Nine sub-assemblies. The stand is the root; everything else hangs off it through a connector."
        src={`
flow
row: . stand .
row: . fuselage .
row: engines windows windshield
play: stand fuselage engines windows windshield
stand <stack> "Stand" [Anchor] {gray} : clear, a 4×4 base and a column
fuselage <stack> "Fuselage" [Rocket] {purple} : white and black, ten layers
engines <stack> "Three engines" [Zap] {orange}
windows <stack> "Four windows" [Grid3x3] {blue}
windshield <stack> "Windshield" [Eye] {red} : and a red mark
stand -> fuselage "hinge, tilted 10°" [RotateCcw]
fuselage -> engines "3 studs" [Magnet]
fuselage -> windows "4 studs" [Magnet]
fuselage -> windshield "2 studs" [Magnet]
`}
      />

      <p>
        Here is what one body looks like once the kernel has it. Cut the shuttle&rsquo;s fuselage down its middle and
        you see the brief&rsquo;s cells, layer by layer: a black belly, a white body, the nose on the left and the
        tail fin on the right.
      </p>

      <Diagram
        title="From cells to plates"
        caption="The fuselage, cut down its centre line. Simplified: the real merge also turns every other layer's plates the other way, so the joins cross in both directions."
        src={`
bricks
layers: plates
w = white
k = black
row: ...........w
row: ..........ww
row: ..........ww
row: .........www
row: .....wwwwwww
row: ...wwwwwwwww
row: .kkwwwwwwwww
row: kkwwwwwwwwww
row: kkwwwwwwwwww
row: kkkkkkkkkkkk
say: The brief fills cells, one colour each. On its own, every cell would be a single 1×1 plate.
say: The kernel merges neighbours of one colour into longer plates, and shifts the joins from layer to layer so the body holds together.
`}
      />

      <p>
        The designer can be asked for several briefs at once, each with a different instruction: “closest to the
        art”, “chunkier and simpler”, or “bolder features”. They are written in parallel, so three take as long as
        one. While the first is still being written, the harness reads it as it streams in, and every time a new body
        is complete it builds the bodies so far and shows them on screen.
      </p>

      {/* 4d · Kernel */}
      <Sub s={S.kernel} />
      <p>
        The kernel turns a brief into a list of real parts in LDraw and checks that list the way a careful builder
        would. It takes milliseconds; almost all of a run&rsquo;s time is spent waiting on models.
      </p>

      <Diagram
        title="Inside the geometry kernel"
        caption="Build, check, and one chance to repair. A round that still won't build is thrown away, and the run keeps its last good model."
        src={`
flow
row: assemble resolve check
row: repair again problems
row: . reject ok
play: assemble resolve check problems again repair assemble resolve check problems ok
assemble <step> "Assemble" [Puzzle] {teal} : cells to real parts
resolve <step> "Trim slivers" [Scissors] {teal} : structure beats decoration
check <step> "Check" [Crosshair] {teal} : collisions, does it stand
problems <decide> "Any problems?" {teal}
again <decide> "Already repaired?" {purple}
repair <round> "Repair" [Wrench] {purple} : the fast model patches
reject <step> "Throw the round away" [Ban] {red} : keep the last good model
ok <pill> "Publish it" [Check] {green} : \`.ldr\`, brief, report
assemble -> resolve -> check -> problems
problems -> ok "no"
problems -> again "yes"
again -> repair "no"
again -> reject "yes"
repair ~> assemble "rebuild" @left [Wrench]
`}
      />

      <p>
        <strong>Assemble.</strong> Inside each body, connectors claim their cells first. The remaining cells start as
        1 × 1 pieces and are merged into bigger real parts, following a method from research on brick sculptures
        (Testuz, Schwartzburg and Pauly, 2013). The first pass only takes merges that join two separate groups, which
        is what removes loose pieces. The second pass merges for size, alternating direction from layer to layer so
        the seams cross. If anything is still loose, that region is broken back into single plates and merged again.
        Finally, a surfacing pass rounds off exposed top edges with curved slopes, and each child body is placed by
        the geometry of its connector: along the side stud, or rotated about the hinge.
      </p>
      <p>
        <strong>Trim slivers.</strong> When a wing on a hinge reaches a few pieces into the body it hangs from, a
        builder would just leave those pieces out. The kernel does the same. Decorative slopes always give way to
        structure, and a child body loses the few pieces that overlap its parent. If the trim would take more than a
        third of a body, it stops and reports the problem instead. In the code&rsquo;s words: trimming a sliver is a
        fix; trimming a third of a body is a cover-up.
      </p>
      <p>
        <strong>Collisions.</strong> Each part&rsquo;s solid body is sampled on a fine lattice, every 4 LDraw units, and
        the samples are dropped into buckets. A bucket claimed by parts from two different bodies is a collision.
        Designed interlocks, such as a hinge top sitting inside its base or a wheel on its pin, are allowed.
      </p>
      <p>
        <strong>Stands.</strong> The centre of mass, with every part weighted by its volume, has to fall inside the
        footprint of the parts touching the ground. Studs grip, so a quarter of a stud past the edge still counts as
        standing.
      </p>

      <Diagram
        title="Does it stand?"
        caption="The shuttle from the side, on its stand, drawn level. The dot is the centre of mass of the brief's cells."
        src={`
bricks
layers: plates
mass: 7.1
w = white
k = black
g = grey
c = trans
row: ...........w
row: ..........ww
row: ..........ww
row: .........www
row: .....wwwwwww
row: ...wwwwwwwww
row: .kkwwwwwwwww
row: kkwwwwwwwwww
row: kkwwwwwwwwww
row: kkkkkkkkkkkk
row: ......gg....
row: ......gg....
row: ......gg....
row: ......cc....
row: ......cc....
row: ......cc....
row: ......cc....
row: ......cc....
row: ......cc....
row: .....cccc...
row: .....cccc...
say: Each body arrives as cells: the fuselage, a hinge brick, and the clear stand.
say: The kernel turns them into real parts.
say: The weight sits over the stand's base, with room to spare.
`}
      />

      <Diagram
        title="And if it didn't?"
        caption="The same model with the stand moved under the nose: an illustration of what the check rejects."
        src={`
bricks
layers: plates
mass: 7.1
w = white
k = black
g = grey
c = trans
row: ...........w
row: ..........ww
row: ..........ww
row: .........www
row: .....wwwwwww
row: ...wwwwwwwww
row: .kkwwwwwwwww
row: kkwwwwwwwwww
row: kkwwwwwwwwww
row: kkkkkkkkkkkk
row: ..gg........
row: ..gg........
row: ..gg........
row: ..cc........
row: ..cc........
row: ..cc........
row: ..cc........
row: ..cc........
row: ..cc........
row: .cccc.......
row: .cccc.......
say: Same fuselage, with the stand moved under the nose.
say: Every part is legal on its own.
say: The weight now sits past the edge of the base. The kernel flags it, and the repair step gets one chance to fix it.
`}
      />

      <p>
        Any problem (a collision, a model that tips, fewer than twelve parts) goes to a repair step. The fast model
        gets the brief and the kernel&rsquo;s report and answers with a patch: only the bodies it changes. The kernel
        rebuilds once. If the result still won&rsquo;t build, that round is thrown away; a legal build always beats a
        prettier broken one.
      </p>

      <p>A simplified version of that rule, as the harness runs it after every brief it writes:</p>

      <Code
        lang="py"
        label="pipeline.py"
        mark="6-7"
        caption="One repair at most. The caller drops the round if the second build still has problems."
      >{`
        def build_checked(brief, fixes=1):
            parts, report, problems = build(brief)
            for _ in range(fixes):
                if not problems:
                    break
                brief = repair(brief, problems)
                parts, report, problems = build(brief)
            return brief, parts, report, problems
      `}</Code>

      {/* 4e · Judge */}
      <Sub s={S.judge} />
      <p>
        A model that passes the kernel is rendered from four angles: front, left, back and right. A headless browser
        opens the app&rsquo;s own 3D viewer once and turns the model for each view, so the renders show exactly what
        you will see.
      </p>
      <p>
        The critic agent (Claude Opus again) gets the concept pictures, the four renders and anything the kernel
        flagged. It replies with a score out of ten and a list of issues, worst first. It is a harsh judge, and that
        is the point: its notes are instructions for the next round, not a grade.
      </p>

      <Diagram
        title="The critique loop, on the shuttle"
        caption="The real exchange from the run's tape, lightly shortened."
        src={`
chat
Critic [Eye] {purple}: 2/10. Doesn't read as a space shuttle at a glance. No vertical tail fin. No engine nozzles.
Designer [Bot] {purple}: Reworked the fuselage and two of the engines.
Kernel [Cpu] {teal}: Round 1. 141 parts, 0 collisions, and it stands.
Critic [Eye] {purple}: 3/10. Reads as a generic jet. The tail fin is a thin plate, not the tall fin in the picture.
( done at 4:14, and round 1 is kept )
`}
      />

      <p>
        The designer&rsquo;s answer is a patch, not a new brief. Patches are about five times less to write, and the
        parts that already work can&rsquo;t drift while something else is being fixed. A loop that rewrote the whole
        brief each round scored 5, then 5, then 3 on the same model.
      </p>

      <p>A simplified version of the rounds that follow the first build:</p>

      <Code
        lang="py"
        label="pipeline.py"
        mark="4, 6-7"
        caption="The app runs one round by default and stops early at a score of 8. Every version built is kept for the choice at the end."
      >{`
        for rnd in range(1, rounds + 1):
            if score >= target:
                break
            brief = revise(brief, issues, shots)
            brief, parts, report, problems = build_checked(brief)
            if parts is None:
                break
            shots = render(f"r{rnd}")
            score, issues = judge(shots, problems)
            built.append(brief)

        review(built)
      `}</Code>
      <p>
        Measuring also turned up a surprise. Over four test runs, the revision round made the model worse every time,
        even once the designer could see the renders it was fixing.
      </p>

      <Diagram
        title="Revising made it worse"
        caption="Critic scores before and after one round of revision, across four runs."
        src={`
bars
max: 10
unit: /10
First build {gray} | 5 | the same in all four runs
Run 1, revised {red} | 3
Run 2, revised {red} | 3
Run 3, revised {red} | 2
Run 4, revised {red} | 2
`}
      />

      <p>
        The lesson was that choice beats polish. Part of the problem was the scores themselves: comparing several
        designs side by side and scoring one design alone produce numbers that don&rsquo;t line up. So the harness
        stopped trusting the score to decide. The app now builds a first version, revises it once, and then shows you
        every version it built, with the critic&rsquo;s favourite marked. You can keep one, or keep one and say what
        to change. If nobody answers within three minutes, the critic decides.
      </p>

      <Diagram
        title="The last word is yours"
        caption="Every built version is offered. A note costs one more model call and one more build. If nobody answers within three minutes, the critic picks."
        src={`
flow
row: built you .
row: critic note change
row: . keep .
play: built you note change keep
built <stack> "Every version built" [Boxes] {teal} : first build, then revised
you <round> "You choose" [User] {orange} : three minutes to answer
note <decide> "Add a note?" {orange}
critic <round> "The critic picks" [Eye] {purple} : if nobody answers
change <step> "Change it" [Pencil] {purple} : “make the wings bigger”
keep <pill> "Keep it" [Check] {green}
built -> you -> note
you -> critic "no answer"
note -> keep "no"
note -> change "yes"
change -> keep "rebuilt"
critic -> keep
`}
      />

      {/* ───────────────────────── 5 · Live ───────────────────────── */}
      <Chapter s={S.live} />
      <p>
        Nothing in a run happens behind a spinner. Every step writes a line to a tape (who did it, what happened, and
        whether it worked), and the tape is saved with the run and streamed to the browser as it happens. A small
        translation layer in the app rewrites each line into plain words, so you read “Sketched the design” rather
        than an engineer&rsquo;s log message.
      </p>

      <Figure bare title="The create screen" caption="A run in progress: the model so far on the left, the tape on the right, newest line on top.">
        <Shot src={appTape} alt="Bricked's create screen: a grey and white Lego rover being built on the left, and a stack of coloured tape entries on the right." />
      </Figure>

      <p>
        Pictures ride the tape as small thumbnails, and every built round is sent to the 3D view the moment it
        exists. While the designer is still writing, the half-finished brief is parsed every 400 characters; once two
        bodies are complete, they are assembled and drawn as a draft. The bricks are real. They are simply not all
        there yet.
      </p>

      <Diagram
        title="The shuttle run, as it streamed"
        caption="Four minutes and fourteen seconds, played back fast. Each line lit up on the create screen as it happened."
        src={`
clock
to: 4:14
seconds: 9
done: "done"
at 0:07 "Concept distilled" [Wand] {orange}
at 0:44 "Concept art ready" [Image] {orange}
at 1:15 "Side and back views" [ScanEye] {orange}
at 2:04 "Brief: 9 sub-assemblies" [Bot] {purple}
at 2:05 "Round 0: 128 parts, stands" [Cpu] {teal}
at 2:25 "Critic: 2/10" [Eye] {purple}
at 3:40 "Round 1: 141 parts, stands" [Cpu] {teal}
at 3:56 "Critic: 3/10" [Eye] {purple}
at 4:14 "Done" [Check] {green}
`}
      />

      {/* ───────────────────────── 6 · Speed ───────────────────────── */}
      <Chapter s={S.speed} />
      <p>
        At the hackathon, the first hummingbird took fourteen minutes. The repository&rsquo;s notes put a typical run
        at about 1,000 seconds before tuning and about 290 after. Most of that came from one setting.
      </p>

      <Figure bare title="One run, before and after tuning" caption="The first hummingbird at the hackathon, and the space shuttle run in this writeup.">
        <Stats
          items={[
            { value: "~14 min", label: "First hummingbird, at the hackathon" },
            { value: "4m 14s", label: "Space shuttle, after tuning", tone: "green" },
          ]}
        />
      </Figure>
      <p>
        By default, the models think before they answer, about 15,000 tokens of thinking to write a brief of about
        1,500. Turning the thinking down on one brief, with the same concept image, gave this:
      </p>

      <Diagram
        title="How hard should the designer think?"
        caption="One brief, written at four effort levels. Medium is the setting: much faster, and still clean."
        src={`
bars
unit: s
Default {red} | 219 | the model's own choice
Medium {green} | 73 | 136 parts, 0 collisions
Low {yellow} | 37 | 114 parts, 8 collisions
Off {gray} | 21 | 197 parts, 13 collisions
`}
      />

      <p>
        So every model call now names its effort: none for the distiller, low for repairs, medium for writing,
        revising and judging designs. The rest of the speed came from removing work rather than doing it faster.
      </p>

      <Diagram
        title="Fourteen minutes to four"
        caption="Six changes, flipped one at a time."
        src={`
tune
from: 14:00
to: 4:14
label: one run
done: "the shuttle run"
lever "Name the effort" [Gauge] {purple} : thinking set per step
lever "Patch, don't rewrite" [Pencil] {purple} : five times less to write
lever "Let code trim slivers" [Scissors] {teal} : no model call for an overlap
lever "Draw while writing" [Image] {orange} : views drawn during the brief
lever "One page, four angles" [Camera] {blue} : renders went from 16s to 6s
lever "Clean calls" [Zap] {gray} : the API, or the CLI from an empty folder
`}
      />

      <p>
        Trimming slivers in code was worth more than it sounds: on one penguin run, it removed every repair round. The
        concept art has a dial too. A high-quality picture takes 31 seconds and a low-quality one 8. Low art is
        blockier, which is actually closer to what the kit can build, but the picture stays on screen for the whole
        run, so the default is high.
      </p>

      <Diagram
        title="The concept art's dial"
        caption="Seconds to draw one concept at each quality setting."
        src={`
bars
unit: s
Low {green} | 8 | blockier, closer to the kit
Medium {yellow} | 13
High {orange} | 31 | the default
`}
      />

      {/* ───────────────────────── 7 · Cache ───────────────────────── */}
      <Chapter s={S.cache} />
      <p>
        A run is a folder: the concept art, the briefs, every built round, the renders and the tape. That folder is
        also the cache. When you ask for something Bricked has already made, it doesn&rsquo;t call a single model. It
        replays the run.
      </p>

      <Diagram
        title="Seen it before?"
        caption="Asking twice replays the first run. A record is saved after every built round, so even a run abandoned halfway can be replayed."
        src={`
flow
row: ask match replay
row: . fresh save
ask <pill> "You ask" [MessageSquare] {orange} : “bus”
match <decide> "Seen it?" [Search] {gray} : match the words
replay <pill> "Replay the run" [Play] {green} : about 20 seconds
fresh <step> "Design it" [Repeat] {purple} : the full harness
save <store> "Save every round" [Database] {gray} : the run is the record
ask -> match
match -> replay "yes" [Play]
match -> fresh "no"
fresh -> save
`}
      />

      <p>
        Matching works the way a person asks. When it matches something other than exactly what you typed, the tape
        says so.
      </p>

      <Points>
        <Point icon="Filter" tone="gray" title="Filler is ignored">
          Words such as “a”, “the” and “build me” don&rsquo;t count.
        </Point>
        <Point icon="ListChecks" tone="blue" title="Every word must appear">
          Each word you typed has to be somewhere in the saved idea.
        </Point>
        <Point icon="Crosshair" tone="orange" title="The last word is the thing">
          “Bus” and “school bus” are the same thing. “Dog” and “dog holding an umbrella” are not.
        </Point>
      </Points>

      <Diagram
        title="How the cache matches"
        caption="The last word is the thing. Everything before it has to fit too."
        src={`
flow
row: q1 r1
row: q2 r2
row: q3 r3
play: q1 r1 q2 r2 q3 r3
q1 <pill> "“bus”" [MessageSquare] {gray}
r1 <store> "yellow school bus" [Check] {green} : the same thing
q2 <pill> "“dog”" [MessageSquare] {gray}
r2 <store> "dog holding an umbrella" [Ban] {red} : the thing is the umbrella
q3 <pill> "“red”" [MessageSquare] {gray}
r3 <store> "a red tractor" [Ban] {red} : the thing is a tractor
q1 -> r1 "replay" [Play]
q2 -x r2
q3 -x r3
`}
      />

      <p>A simplified version of the rule:</p>

      <Code
        lang="py"
        label="pipeline.py"
        mark="9"
        caption="Among the matches, an exact one wins, then the one with the fewest extra words, then the newest."
      >{`
        FILLER = {"a", "an", "the", "of", "with", "build", "me"}

        def words(idea):
            found = re.findall(r"[a-z0-9]+", idea.lower())
            return [w for w in found if w not in FILLER]

        def matches(asked, saved):
            want, have = words(asked), words(saved)
            return have[-1] == want[-1] and set(want) <= set(have)
      `}</Code>

      <p>
        A replay is not a mock-up. It plays the real tape, shows the real concept art, and puts the real model together
        on screen in a few pieces, as the first run did. It just doesn&rsquo;t wait on models that have already
        answered, so the whole thing takes about twenty seconds. Favourite runs can be exported into the repository,
        slimmed to about 400 KB each, so a model made on one laptop opens on another.
      </p>

      <Figure bare title="Design once, replay in seconds" caption="The shuttle, designed from scratch and then replayed from its folder.">
        <Stats
          items={[
            { value: "4m 14s", label: "Designing it, every model call for real" },
            { value: "~20s", label: "Replaying it: the same tape, art and model", tone: "green" },
          ]}
        />
      </Figure>

      {/* ───────────────────────── 8 · Order ───────────────────────── */}
      <Chapter s={S.order} />
      <p>
        Because the kernel only ever places parts that exist, the model doubles as a shopping list. The LDraw file
        already marks the build steps, which the app turns into a manual: one page per step, with that step&rsquo;s
        parts laid out beside it.
      </p>

      <Figure bare title="The manual" caption="Step 10 of 18 of a street racer, with the parts that step needs.">
        <Shot src={appSteps} alt="Bricked's instruction view: step 10 of 18 of a Lego street racer, with the step's parts listed on the left." />
      </Figure>

      <p>
        The same parts, counted by part and colour, become the order. Bricked estimates a price for each one, then
        writes a BrickLink Wanted List, translating every LDraw colour into BrickLink&rsquo;s. One button copies the
        list and opens BrickLink&rsquo;s upload page, where you paste it and buy the lot. Anything BrickLink
        doesn&rsquo;t sell is counted and left out, not silently dropped.
      </p>

      <Diagram
        title="From a model to an order"
        caption="Every step here is plain code. No model is involved."
        src={`
flow
row: model list .
row: skip sold wanted
row: . . shop
model <stack> "The model" [Boxes] {teal} : every part and colour
list <doc> "Parts list" [ClipboardList] {blue} : counted by part and colour
sold <decide> "Sold on BrickLink?" {green}
skip <step> "Counted, left out" [Ban] {gray} : never dropped silently
wanted <io> "Wanted List" [CircleDollarSign] {green} : BrickLink colours, a price each
shop <pill> "Buy the lot" [ShoppingCart] {green}
model -> list -> sold
sold -> wanted "yes"
sold -> skip "no"
wanted -> shop
`}
      />

      <Figure bare title="Buy the bricks" caption="On a phone, the button sits under every build, with an estimate of what the parts cost.">
        <Shot
          src={appPhoneBuy}
          alt="Bricked on a phone: a small Lego model with a green button reading 'Buy the bricks · ~$6.77'."
          contain
          style={{ maxWidth: 300, margin: "0 auto" }}
        />
      </Figure>

      <p>
        Finished models can also be changed in plain words. “Make the wings bigger” goes to the designer with the
        current brief and the concept picture, the kernel rebuilds the result, and if the change won&rsquo;t build,
        you keep the model you had.
      </p>

      {/* ───────────────────────── 9 · Limits ───────────────────────── */}
      <Chapter s={S.limits} />
      <p>
        The harness builds a wide range of things well: animals, vehicles, buildings, people and at least one meme.
      </p>

      <Figure wide bare title="Imagined, then built" caption="Twelve runs from the gallery. Hover or tap a card to see the picture the image model drew.">
        <Mosaic items={GALLERY} />
      </Figure>

      <p>
        The critic still asks for things the kit can&rsquo;t make yet, and the repository keeps that list. Every item
        on it is a new connector or a new part, never a return to letting models place bricks:
      </p>
      <ul>
        <li>a second rotation axis, for swept-back wings and turned heads;</li>
        <li>clips and bars at any angle, for beaks, shafts and handles;</li>
        <li>wedge plates for feathers and tapered tails (already measured, not yet in the brief);</li>
        <li>straight roof slopes, so a pitched roof stops looking curled (a house scored 5/10 on exactly this);</li>
        <li>round bricks and cones, for bushes, trees and paws;</li>
        <li>rejecting weak joints in the kernel, instead of waiting for the critic to notice them.</li>
      </ul>

      <Figure bare title="A hummingbird, in bricks" caption="The idea that started the harness, built by it. Tap a side to stop it there.">
        <Turntable frames={[hbFront, hbRight, hbBack, hbLeft]} alt="A Lego hummingbird built by Bricked" label="Hummingbird" />
      </Figure>

      <p>
        The idea underneath is simple. We imagine before we build, and the first version of Bricked couldn&rsquo;t.
        Giving the agents a picture to work from, and giving the geometry to code, is what turned the blobs into
        models you can buy.
      </p>
    </>
  );
}
