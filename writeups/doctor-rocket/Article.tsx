import { S } from "./meta";
import { Diagram } from "@/components/diagram/Diagram";
import { Chapter, Code, Figure, Shot, Stats, Sub } from "@/components/writeup/parts";
import { CallFlow } from "./figures/CallFlow";
import { Clocks } from "./figures/Clocks";
import { DebugTabs } from "./figures/DebugTabs";
import { Explain } from "./figures/Explain";
import { Formatter } from "./figures/Formatter";
import { Arrows } from "./figures/Arrows";
import { Choreo } from "./figures/Choreo";
import { ImageChar } from "./figures/ImageChar";
import { MemoryFlow } from "./figures/MemoryFlow";
import { MiniViz } from "./figures/MiniViz";
import { Relex } from "./figures/Relex";
import { Stepper } from "./figures/Stepper";
import { Terminal } from "./figures/Terminal";
import { UpdateFlow } from "./figures/UpdateFlow";
import { UserWritten } from "./figures/UserWritten";
import { Wire } from "./figures/Wire";
import "./figures/figures.css";

import visualizerShot from "@/assets/writeups/doctor-rocket/visualizer.webp";
import imagesShot from "@/assets/writeups/doctor-rocket/drracket-files.webp";

export function Article() {
  return (
    <>
      {/* 1 · What it is */}
      <Chapter s={S.what} />
      <p>
        Waterloo&rsquo;s first-year computer science courses, CS 135 and CS 145, teach programming in Racket, and
        possibly other schools do too. Students write in the teaching languages (Beginning Student, Intermediate
        Student and their relatives) inside DrRacket, the IDE that ships with Racket. DrRacket is careful and
        correct, and it is dated. In the words of Dr. Rocket&rsquo;s README, it &ldquo;looks and feels like it was
        built a long time ago.&rdquo;
      </p>
      <p>
        Dr. Rocket is a modern rendition of it, written in Rust. It reads and writes the same files, runs them on the
        real Racket, using Racket&rsquo;s own stepper, check syntax, debugger and test engine. Around them it puts a
        GPU-drawn editor with tabs, a file tree, a formatter, a terminal and vim keys, and a Visualizer that draws a
        program while it runs.
      </p>
      <Figure bare title="Eight days" caption="From the first commit to beta 14, counted from the repository's history.">
        <Stats
          items={[
            { value: "8 days", label: "First commit to beta 14" },
            { value: "266", label: "Commits" },
            { value: "14", label: "Betas shipped" },
            { value: "100,000", label: "Random edits each lexer test run" },
          ]}
        />
      </Figure>
      <p>
        Most of it was written on the first two days. The core editor, the Racket backend and the terminal landed
        within the first hour, merged from several parallel branches. The Visualizer arrived the same afternoon, and
        the first beta went out that evening. The days after that were for parity with DrRacket, and for hardening.
      </p>
      <Diagram
        title="Commits per day"
        caption="Two heavy days to build it, then a week of smaller fixes, and a final push before beta 14."
        src={`
bars
unit: commits
max: 140
Oct 16 {blue} | 109 | the editor, the backend, the Visualizer, beta 1
Oct 17 {blue} | 67 | vim, updates, the memory limit, the virtual clock
Oct 18 {gray} | 8
Oct 19 {gray} | 16 | the updater hardened
Oct 20 {gray} | 1
Oct 21 {gray} | 5
Oct 22 {gray} | 10
Oct 23 {blue} | 50 | beta 14
`}
      />

      {/* 2 · Shape */}
      <Chapter s={S.shape} />
      <p>
        Dr. Rocket is one Rust app and three kinds of Racket process. The app is drawn with egui, an immediate-mode
        UI that repaints the whole window each frame. It owns the text, the editing and every pixel. In the words of
        its design notes, &ldquo;the Rust side never guesses semantics&rdquo;: anything that needs Racket&rsquo;s own
        answer goes to Racket.
      </p>
      <p>
        One server per app checks syntax, finds bindings and serves the documentation; a newer check cancels an
        older one. One runner per run executes the program, the debugger and the Visualizer, and a spare runner is
        always started in advance, so pressing Run doesn&rsquo;t wait for Racket to boot. One stepper per session
        drives Racket&rsquo;s own stepper. All of them talk to the app in JSON, one object per line, over stdin and
        stdout. The split keeps the rules of the teaching languages where they already live, in Racket, and lets the
        app drop any process that misbehaves: a server request pending for more than 30 seconds restarts the whole
        server.
      </p>
      <Figure title="Rust draws, Racket decides" caption="One check, one run and one step, as the messages they send. Each pipe carries one JSON object per line; the messages here are shortened." tools>
        <Wire />
      </Figure>

      {/* 3 · Visualizer */}
      <Chapter s={S.viz} />
      <p>
        The Visualizer is the reason to switch. It runs the program once, records every call, question and value,
        and then lets the student scrub through the run. Each call is a card with its arguments. A waiting call
        shows what it will do with the answer. Structures are drawn as the boxes and arrows a course draws on the
        board.
      </p>
      <Figure bare title="The Visualizer" caption="Step 60 of 93 of tree-sum on a binary search tree: the call stack on the left, the tree it walks on the right, and the step in words below.">
        <Shot src={visualizerShot} quality={92} alt="Dr. Rocket with bst.rkt open on the left, and the Visualizer on the right drawing a stack of tree-sum calls beside the tree of nodes 5, 3, 8, 1, 4 and 9." />
      </Figure>

      {/* 3a · Instrumenting */}
      <Sub s={S.instrument} />
      <p>
        To record a run, the runner rewrites the program before it runs. It expands the code to Racket&rsquo;s core
        forms, then walks them (<code>annotate-expr</code> in <code>visualize.rkt</code>). Every lambda the user
        wrote is registered as a user function. Every <code>if</code> test reports its answer. Every application
        the user wrote is split in two: first its parts are evaluated into temporaries and the call site is noted,
        then the call is made.
      </p>
      <p>A simplified version of what one call becomes:</p>
      <Code lang="rkt" label="(fact (- n 1)), annotated" mark="5-6">{`
        (let ([f fact] [a (- n 1)])
          (viz-site! pos span #f)      ; #f: not in tail position
          (if (viz-primitive? f)
              (viz-compute pos span f (list a))
              ; a user function is called as written
              (f a)))
      `}</Code>
      <p>
        The last line is the point. A primitive, such as <code>-</code>, is recorded with its arguments and its
        result. A call to the user&rsquo;s own function is left as written, with nothing wrapped around it, so a
        call in tail position stays a tail call. The runner tracks tail position as it walks, including through the{" "}
        <code>begin0</code> that the teaching languages wrap around function bodies. When a tail call happens, the
        new frame replaces its caller instead of stacking on top of it, and the caller records no return. That is how
        Racket runs it, and the Visualizer draws exactly that.
      </p>
      <Figure title="One call, instrumented" caption="Three calls take three paths. A primitive becomes a result step; a user call becomes a frame, which either waits for its caller or replaces it." tools>
        <CallFlow />
      </Figure>
      <p>
        Each recorded step carries a snapshot of the values it can reach. Objects get stable ids, and an object is
        sent again only when it changes. A run records at most 1,500 steps and 600 objects per snapshot, so an
        infinite loop still ends in a picture.
      </p>

      {/* 3b · Drawing */}
      <Sub s={S.drawing} />
      <p>
        The app turns those steps into the picture. Nothing tells it that a <code>node</code> is a tree. It learns
        that from the data (<code>learn_shape</code> in <code>visualizer/mod.rs</code>): a struct field that points to
        another struct of the same type is a link, and a field that has only ever held <code>empty</code> or{" "}
        <code>#false</code> is an empty child slot. Any struct with links is drawn as a tree, with its children in
        field order. The same rule draws a list of structs as a chain and a family tree as a tree, with no
        configuration.
      </p>
      <p>Here is the program from Dr. Rocket&rsquo;s own demo:</p>
      <Code lang="rkt" label="bst.rkt" mark="4-6">{`
        (define-struct node (key left right))

        (define (tree-sum t)
          (cond [(empty? t) 0]
                [else (+ (node-key t)
                         (tree-sum (node-left t))
                         (tree-sum (node-right t)))]))
      `}</Code>
      <p>
        Each call is a card. It shows the call, its argument, and the question its <code>cond</code> asked. When a
        call waits on a recursive call, its card shows the rest of its work with a hole where the answer will go. When
        the answer comes back, it rides up into that hole. A line joins each card to the node it holds, and anything
        the running call cannot reach is faded.
      </p>
      <Figure title="tree-sum, drawn" caption="A simplified Visualizer, replaying the real run's steps. Watch the holes fill as values return, and the bars below: one per step, as tall as the stack." wide tools>
        <MiniViz />
      </Figure>
      <p>
        The bars along the bottom are the recursion graph. Its shape is the shape of the recursion: a ramp for a
        list, a saw for a tree. Clicking a bar jumps to that step.
      </p>

      {/* 3c · Words */}
      <Sub s={S.words} />
      <p>
        Under the picture, each step is also written out in words (<code>explain.rs</code>). The app reads the
        expression at the step&rsquo;s source position and phrases it from its shape, using the values the step
        recorded. A predicate becomes a question and its answer. A selector becomes a possessive. A recursive call is
        named as recursion, and each value says where it came from: &ldquo;t is node 18, which was t&rsquo;s left in
        the previous call.&rdquo;
      </p>
      <Figure title="Code into words" caption="One insert into a binary search tree, as the Visualizer explains it. The wording is from explain.rs's tests; the accessor names come from the program's own define-struct." tools>
        <Explain />
      </Figure>
      <p>
        The phrasing follows the course&rsquo;s own vocabulary, so the text under the picture reads like the
        explanation a teaching assistant would give at the board.
      </p>

      {/* 3d · Choreography */}
      <Sub s={S.choreo} />
      <p>
        A step can change several things at once: a question fades, a value appears, a card moves. The app plays
        all of them inside one 600 ms transition. While the program plays, the transition shrinks to 0.85 s divided
        by the speed, so at 8&times; a step takes 85 ms. Each part reads its own window of that transition through a
        small function, <code>phase</code>, which eases it with a cubic ease-out.
      </p>
      <p>
        On a return, the old question fades in the first quarter while the value appears. The value then travels
        up the connector between 20% and 75% of the transition as the caller&rsquo;s border turns green, and it
        fills the hole only after it lands. Cards glide to new positions over 350 ms. If the next step arrives
        mid-glide, each card restarts from where it is drawn at that moment, not from where the last layout put it,
        so nothing jumps.
      </p>
      <Figure title="Choreographing a step" caption="One step of the Visualizer, slowed down. Each part of a return runs in its own window of a 600 ms transition; drag the timeline to scrub it, or pick a speed to see the transition shorten. Below, a new step arrives a quarter of the way into a glide, and the card turns from where it is drawn." tools>
        <Choreo />
      </Figure>

      {/* 4 · Editor core */}
      <Chapter s={S.editor} />
      <p>
        The editor is written from scratch, because a Racket editor needs to know Racket at every keystroke: where
        a form starts, which bracket matches which, and what DrRacket would indent. Four pieces show how it is
        built.
      </p>

      {/* 4a · Relexing */}
      <Sub s={S.relex} />
      <p>
        The editor keeps the whole file as a flat list of tokens. Each token has its range, its kind, its bracket
        depth and the index of its matching bracket. Colouring, bracket matching, indentation and the formatter all
        read from that list, so it must be right after every edit, and it must be cheap to keep right.
      </p>
      <p>
        After an edit, the lexer (<code>relex</code> in <code>lexer.rs</code>) restarts one token before the first
        token the edit touches, and further back if that token is not a safe place to start, such as the middle of a
        string escape. It lexes forward from there. Past the edit, it compares each new token with the old token at the same place, shifted by the length
        the edit added or removed. As soon as the two match, the rest of the file is known to be unchanged: the old
        tail is kept, shifted, and its bracket partners are renumbered. Up to 16 pending edits are applied this way;
        more than that, and a full lex is cheaper.
      </p>
      <Figure title="Relexing one edit" caption="Two edits. The lexer backs up one token, relexes the edit, and stops as soon as a new token lines up with an old one moved by the edit's length. Everything after keeps its tokens; only their offsets change." tools>
        <Relex />
      </Figure>
      <p>
        Incremental lexers are easy to get subtly wrong, so this one is checked against the slow way. A test makes
        100,000 random edits, in 4,000 rounds of 25, using the fragments most likely to break a lexer: a block
        comment opened and never closed, a lone quote, a here-string, a <code>#lang</code> line, a{" "}
        <code>λ</code>. After every edit, the token list must equal a full lex of the text, down to depths and
        bracket partners.
      </p>

      {/* 4b · Formatter */}
      <Sub s={S.format} />
      <p>
        The formatter reindents code to the Racket style guide. Most formatters print a tree with fixed rules. This
        one searches. For each form that doesn&rsquo;t fit on one line, it tries the layouts that form allows (all on
        one line, the arguments lined up under the first, or everything indented under the head) and scores each
        one. The score is a pair: first, how many columns run past the guide, then how many lines it uses. The
        lowest pair wins, so a layout never overflows to save a line.
      </p>
      <Figure title="Layouts, scored" caption="Three layouts for one form at a 40-column guide (the default is 102), scored as columns past the guide, then lines. The winner must lex to the same tokens: only whitespace may change." tools>
        <Formatter />
      </Figure>
      <p>
        Each kind of form has a shape. A call lines its arguments up. <code>define</code> and <code>lambda</code>{" "}
        keep their headers on the first line and indent their bodies. <code>cond</code> stacks its clauses. Renders
        are memoised by form, column and context, so the search stays fast on long files.
      </p>
      <p>
        The formatter must never change a program. After formatting a form, it lexes the result and compares it with
        the original, token by token. If any kind or text differs, it leaves that form as it was. The tests run it
        at widths of 40, 80 and 102 columns, including on real student code, and check that the output is idempotent
        and that DrRacket&rsquo;s own indenter leaves it unchanged.
      </p>

      {/* 4c · Images */}
      <Sub s={S.images} />
      <p>
        Racket&rsquo;s teaching languages treat images as values: a student can paste a picture into the code and
        pass it to a function. DrRacket can do this because its editor holds snips, objects that sit in the text
        like characters. In a plain text editor, an image breaks every assumption that a character is a character.
      </p>
      <p>
        Dr. Rocket avoids the problem by making an image a character. Each pasted image gets a code point from a
        Private Use Area, between U+F0000 and U+FFFFD, and a table maps that character to the image&rsquo;s bytes. To
        the rope, the cursor, undo, deletion, and copy and paste, the image is one ordinary character. Only the
        painter knows: it draws the character as a single space, widened by exactly the thumbnail&rsquo;s width, and
        draws the picture over it.
      </p>
      <Figure title="An image is one character" caption="A pasted image is one Private Use Area character, drawn as one widened space with the thumbnail over it. Pasting into a file where that character already means another image renumbers it. Sizes are illustrative." tools>
        <ImageChar />
      </Figure>
      <p>
        At the boundaries, the character becomes an image again. On a run, the runner feeds the program through a
        port that carries special values, so Racket&rsquo;s reader sees a real image where the character was. On
        save, the file is written in DrRacket&rsquo;s own format. When two pasted images claim the same code point,
        the clipboard renumbers the newcomer.
      </p>
      <Figure bare title="A picture in the code" caption="A rocket pasted into a Beginning Student file, used as a value, and drawn in the interactions.">
        <Shot src={imagesShot} quality={92} alt="Dr. Rocket with poster.rkt open: a rocket image sits inside the code as the value of rocket, and the interactions show the posters it makes." />
      </Figure>

      {/* 4d · Binding arrows */}
      <Sub s={S.arrows} />
      <p>
        Hovering over a name draws arrows from where it is bound to each of its uses, as DrRacket does. The arrows
        come from Racket&rsquo;s check syntax, which reports them as character offsets. The first keystroke makes
        those offsets stale, but the editor does not throw them away. It maps both ends of every arrow through each
        edit, the same way it maps the cursor, so text typed above a binding carries its arrows down with it.
      </p>
      <p>
        Each edit restarts a 0.45 s countdown to the next check. A new check cancels one still running, and a
        result for an older version of the text is dropped. Half-typed code is briefly wrong, so an error inside the
        form being typed is held until the cursor leaves that form.
      </p>
      <Figure title="Arrows that survive typing" caption="The mouse rests on lst. Edits above it move every stored arrow end, so the arrows ride along until the next check replaces them. An error in the definition being typed waits until the cursor leaves it." tools>
        <Arrows />
      </Figure>

      {/* 5 · Running */}
      <Chapter s={S.running} />
      <p>
        Running a student&rsquo;s program is where an IDE for beginners earns trust. The program will loop, run out
        of memory and fail in ways the student doesn&rsquo;t yet understand. Four details show how the runner handles
        it.
      </p>

      {/* 5a · Memory */}
      <Sub s={S.memory} />
      <p>
        Both IDEs limit a program&rsquo;s memory. When DrRacket&rsquo;s limit is reached, it shuts the program down,
        and the student loses the run. Dr. Rocket pauses it instead and asks.
      </p>
      <p>
        The runner notes Racket&rsquo;s memory use just before the program starts and checks it every 25
        milliseconds. If the program is over the limit, it first collects garbage and checks again, since garbage
        counts until it is collected. If the program is still over, the runner walks the program&rsquo;s custodian
        tree and suspends every running thread it finds. It remembers exactly which threads it suspended, and when
        the student raises the limit and continues, it resumes only those. Threads the program had suspended itself
        stay suspended.
      </p>
      <Figure title="Over the limit" caption="Four runs: one under the limit, one over it only with garbage, one paused until the limit is raised, and the same program in DrRacket." tools>
        <MemoryFlow />
      </Figure>
      <p>
        The test for this sets a 64 MB limit and allocates 100 MB. The run pauses, the test raises the limit to
        512 MB, and the program finishes and prints 100.
      </p>

      {/* 5b · Debugger */}
      <Sub s={S.debugger} />
      <p>
        Students split assignments across files, and they debug with all of them open and half of them unsaved. In
        DrRacket, a required file is loaded from disk, so a breakpoint in an unsaved edit is never reached.
      </p>
      <p>
        When Dr. Rocket starts a debug run, it sends the text of every other open tab with it. The runner replaces
        Racket&rsquo;s module loader with its own. When the program requires a file that is open in a tab, the loader
        reads the tab&rsquo;s text from a string instead of the file, then expands it, annotates it for the debugger
        and evaluates it. Breakpoints and stepping work in every open file, as the student sees it.
      </p>
      <Figure title="Unsaved tabs" caption="helper.rkt is open in another tab, unsaved. The debugger loads the tab's text instead of the file, pauses at y = 21 and returns 42, where the saved copy would give 0." tools>
        <DebugTabs />
      </Figure>

      {/* 5c · Headers */}
      <Sub s={S.headers} />
      <p>
        A teaching-language file starts with three lines that DrRacket writes: two comments and a reader line that
        records the language and its settings. Course tools read these lines, so Dr. Rocket writes them exactly as
        DrRacket does.
      </p>
      <p>DrRacket 9.3&rsquo;s header for a new Beginning Student file, which Dr. Rocket writes byte for byte:</p>
      <Code lang="rkt" label="a01q1.rkt" mark="3" caption="The test that checks this notes that course tools such as Marmoset read these files.">{`
        ;; The first three lines of this file were inserted by DrRacket. They record metadata
        ;; about the language level of this file in a form that our tools can easily process.
        #reader(lib "htdp-beginner-reader.ss" "lang")((modname a01q1) (read-case-sensitive #t) (teachpacks ()) (htdp-settings #(#t constructor repeating-decimal #f #t none #f () #f)))
      `}</Code>
      <p>
        Getting this right meant reproducing Racket&rsquo;s printer for the values in that line, including how it
        quotes a symbol: a module named <code>two words</code> is written <code>|two words|</code>. A small reader
        parses existing headers, and opening and saving a file keeps its header bytes untouched. One test saves a file
        and loads it in plain Racket the way a grader does, then checks that <code>(double 21)</code> is 42.
      </p>

      {/* 5d · user-written? */}
      <Sub s={S.userWritten} />
      <p>
        The debugger shows the local variables of each frame. Expanded teaching-language code has more variables than
        the student wrote: the language introduces its own, with names like <code>test1651</code> and{" "}
        <code>repl?</code>. Those borrow the source location of the form behind them, so a location alone can&rsquo;t
        tell them apart from the student&rsquo;s.
      </p>
      <p>
        The runner uses a simpler test (<code>user-written?</code> in <code>runner.rkt</code>): the text at the
        identifier&rsquo;s position must spell the identifier&rsquo;s name. A variable the student typed passes,
        because that is where they typed it. A variable the language made up points at text that says something else,
        and is hidden.
      </p>
      <Figure title="Is it yours?" caption="acc is shown; test1651 borrows a location whose text says something else, and is hidden." tools>
        <UserWritten />
      </Figure>
      <p>
        In the test, a frame of <code>(pow b (sub1 e) (* acc b))</code> shows exactly <code>b</code>,{" "}
        <code>e</code>, <code>acc</code> and <code>pow</code>, and nothing else.
      </p>

      {/* 6 · Stepper */}
      <Chapter s={S.stepper} />
      <p>
        Dr. Rocket does not write its own stepper. It runs DrRacket&rsquo;s stepper in a Racket process and streams
        each reduction to the editor as JSON, pausing every 500 steps until the editor asks for more. By default,
        every step matches DrRacket&rsquo;s. A test steps <code>(is-list? (cons &apos;a (cons &apos;b empty)))</code>{" "}
        and compares the result with DrRacket 9.3&rsquo;s stepper window, step for step.
      </p>
      <p>
        Matching DrRacket also meant matching how it prints. DrRacket builds its print settings in its GUI thread,
        where built lists print as <code>list</code>, so <code>(cons &apos;b &apos;())</code> appears as{" "}
        <code>(list &apos;b)</code> even in Beginning Student. Dr. Rocket forces the same setting.
      </p>
      <Figure title="Stepping like DrRacket" caption="Stepping (f 5 17 3) in Beginning Student. Top: DrRacket's 37 reductions, which Dr. Rocket shows by default. Bottom: the functional step trace, which folds each call into one step and keeps the last call's reductions, leaving 13. Built lists print as list, as DrRacket prints them." tools>
        <Stepper />
      </Figure>
      <p>
        A recursive function makes a long trace, so an opt-in setting, the functional step trace, shortens it. The
        stepper holds back the reductions between two calls of a user function and shows them as one step, keeping
        the expression around the call. After the last call, the remaining reductions are shown in full.
      </p>

      {/* 7 · Robot */}
      <Chapter s={S.robot} />
      <p>
        Dr. Rocket can be driven by a script: a JSON file of steps that opens files, types, clicks, scrubs the
        Visualizer, waits for a run to finish and records video. The same scripts test updates in CI, run the
        benchmarks and film the website&rsquo;s videos. Filming on the wall clock drops frames whenever one is slow
        to draw, so while recording, the app runs on a virtual clock instead. Frame <em>n</em> is told the time is
        the start plus <em>n</em>/30 of a second, however long it took. Frames pass through a channel that holds
        four, so a slow encoder slows the app rather than losing frames.
      </p>
      <Figure title="Two clocks" caption="The same ten frames filmed two ways, with illustrative timings. On the wall clock, slow frames repeat and quick ones are lost. On the virtual clock, frame k happens at k/30 s, so every frame lands once." tools>
        <Clocks />
      </Figure>

      {/* 8 · Terminal */}
      <Chapter s={S.terminal} />
      <p>
        Dr. Rocket includes a terminal; even installing a Racket package runs in a terminal tab. It is a real
        terminal: a pseudo-terminal running the user&rsquo;s login shell, and alacritty&rsquo;s parser for the escape
        sequences. The hard part is drawing it in an immediate-mode UI, which rebuilds the whole frame every time.
      </p>
      <p>
        Laying out a full screen of text every frame is too slow, so the terminal caches each row&rsquo;s layout,
        keyed by a hash of the row&rsquo;s cells and the font. Most frames reuse almost every row. egui sometimes
        rebuilds its glyph atlas, which invalidates every cached layout. The terminal notices this when the
        atlas&rsquo;s fill ratio drops, and flushes the cache.
      </p>
      <Figure title="A terminal in an immediate-mode UI" caption="Each frame lays out only the rows whose hash changed, and drops the whole cache when egui rebuilds its glyph atlas. Box characters are drawn from four arms, so neighbours always join." tools>
        <Terminal />
      </Figure>
      <p>
        Box-drawing characters are not drawn from the font at all. A glyph rarely fills its cell, including the line
        spacing, so the borders in tools like htop and tmux show gaps. The terminal draws about seventy of these
        characters itself, as rectangles: each character is a set of arms (up, right, down, left), each light, heavy
        or double, and a light line is a ninth of the cell&rsquo;s width, at least one pixel. The arms reach the cell
        edges, so neighbouring characters join without a seam.
      </p>

      {/* 9 · Shipping */}
      <Chapter s={S.shipping} />
      <p>
        Students install Dr. Rocket on their own laptops, so it updates itself, and it has to do so safely. Each
        update is signed with Ed25519 by a key built into the app. The signature covers a fixed tag, then the
        version, the platform, the download&rsquo;s SHA-256 and its URL, one per line, so changing any of them breaks
        it, and nothing signed for another purpose passes as an update. The archive is checked when it arrives and
        again just before install, and a downloaded program is never run. To install, the app renames itself aside,
        moves the new copy into place, and renames itself back if anything fails.
      </p>
      <Figure title="A signed update" caption="Four updates, four paths: a good one, one with a changed URL, one run from the disk image, and one whose swap fails and is undone." tools>
        <UpdateFlow />
      </Figure>
      <p>
        One more safety net runs at launch. On Windows and Linux, a launch that finds the previous one crashed before
        painting steps down a list of renderers, from the default to software, and remembers the one that works.
      </p>

      {/* 10 · Limits */}
      <Chapter s={S.limits} />
      <p>
        The Visualizer records at most 1,500 steps, so a long run is cut short and says so. A large structure is
        drawn in part. Dr. Rocket needs Racket installed, since it runs every program on the real thing. And some
        claims are still only claims: the editor&rsquo;s comment that a keystroke relexes in 0.2 ms comes with a
        benchmark that prints a number but checks none.
      </p>
      <p>
        Several features didn&rsquo;t fit here and deserve a line each: a vim mode with counts, operators and
        text objects; undo that groups typing the way a person expects; and exact fractions printed as repeating
        decimals, so 1/3 shows as 0.3 with a bar over the 3.
      </p>
    </>
  );
}
