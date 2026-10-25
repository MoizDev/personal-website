/**
 * The example writeup: a fictional project, written to show every part of the
 * kit once. Copy its shape, not its words. The images are placeholders.
 */

import {
  Beat,
  Chapter,
  Chip,
  Code,
  Diagram,
  Figure,
  Hood,
  Mosaic,
  Pair,
  Pane,
  Point,
  Points,
  Polaroids,
  Quote,
  Shot,
  Stats,
  Sub,
  Turntable,
} from "@/writeup";
import { S } from "./meta";
import dashAfter from "./assets/dashboard-after.webp";
import dashBefore from "./assets/dashboard-before.webp";
import jobs from "./assets/jobs.webp";
import lightBack from "./assets/light-back.webp";
import lightFront from "./assets/light-front.webp";
import lightLeft from "./assets/light-left.webp";
import lightRight from "./assets/light-right.webp";
import sketch1 from "./assets/sketch-1.webp";
import sketch2 from "./assets/sketch-2.webp";
import sketch3 from "./assets/sketch-3.webp";
import glacier from "./assets/tile-glacier.webp";
import glacierOut from "./assets/tile-glacier-out.webp";
import harbour from "./assets/tile-harbour.webp";
import harbourOut from "./assets/tile-harbour-out.webp";
import lantern from "./assets/tile-lantern.webp";
import lanternOut from "./assets/tile-lantern-out.webp";
import meadow from "./assets/tile-meadow.webp";
import meadowOut from "./assets/tile-meadow-out.webp";
import orchard from "./assets/tile-orchard.webp";
import orchardOut from "./assets/tile-orchard-out.webp";
import skyline from "./assets/tile-skyline.webp";
import skylineOut from "./assets/tile-skyline-out.webp";

export function Article() {
  return (
    <>
      <Chapter s={S.what} />
      <p className="wu-lede">
        A web app should answer a click in a few hundred milliseconds. Resizing a photo, sending an email or calling
        someone else&apos;s server can take much longer, so the app hands that work to Ferry and answers at once.
      </p>
      <p>
        The app adds a job with a kind and a payload. Ferry keeps it in a <Chip icon="Database" tone="teal">jobs table</Chip>{" "}
        in Postgres, and any free <Chip icon="Cog" tone="purple">worker</Chip> picks it up and runs it.
      </p>

      <Diagram
        title="The short version"
        caption="A job is added, kept, and run. The token on each arrow is what travels along it."
        src={`
flow
cols: 3
add "Add a job" [Send] {orange} : \`ferry.add("resize", …)\`
keep "Keep it" [Database] {teal} : one row in Postgres
run "Run it" [Cog] {purple} : on any free worker
add -> keep [Package]
keep -> run [Package]
`}
      />

      <Points>
        <Point icon="ShieldCheck" tone="teal" title="Never lose a job">
          A job leaves the table only when its worker says it finished.
        </Point>
        <Point icon="Repeat" tone="purple" title="Retry, politely">
          A failing job waits longer each time, then stops and says why.
        </Point>
        <Point icon="Eye" tone="orange" title="Show the truth">
          One table holds every job&apos;s state, so the dashboard reads it directly.
        </Point>
      </Points>

      <Chapter s={S.lost} />
      <p>
        The first version kept jobs in a list in memory. A worker popped a job off the list and ran it. When a worker
        died halfway, during a deploy or when it ran out of memory, the job died with it. Nothing recorded that it had
        ever existed.
      </p>

      <Diagram
        title="The first version"
        caption="Popping removes the job before it runs, so a crash takes it away for good."
        src={`
flow
cols: 3
pop "Pop the job" [Inbox] {gray} : removed from the list
run "Run it" [Cog] {purple}
crash "Worker stops" [X] {red} : a deploy, out of memory
pop -> run
run -x crash
`}
      />

      <p>The first report came from a user, a week after launch:</p>

      <Diagram
        title="How we found out"
        caption="A user's thumbnail never appeared. The logs had no record of the job."
        src={`
chat
call: "Support"
> Support [User] {orange}: My photo uploaded, but the thumbnail never showed up.
Ada [Wrench] {teal}: I can see the upload. I can't find a resize job for it at all.
(the worker had restarted during a deploy, mid-job)
Ada [Wrench] {teal}: It was popped, then the worker restarted. The job is gone.
`}
      />

      <p>
        Counting afterwards, about one job in two hundred had gone the same way: every job that was running when a
        worker restarted.
      </p>

      <Diagram
        title="One in two hundred"
        caption="Each dot is a job from a day of traffic, simplified. The lit one was running during a restart."
        src={`
dots
count: 200
highlight: 1
cols: 25
label: "200 jobs"
pick: "1 lost"
`}
      />

      <Chapter s={S.map} />
      <p>
        The rewrite keeps every job in a table and never deletes a row to claim it. Your app writes a row. A worker
        claims the row for a short time, runs it, and marks it done. A failure sends it back to wait.
      </p>

      <Diagram
        wide
        title="How the pieces fit"
        caption="Each band is who does the work. Click a step to stop on it and read more."
        panes={{
          claim: (
            <Pane kicker="Claim" imgs={[jobs]}>
              A worker takes the oldest due job and writes its own name and an expiry time on the row.
            </Pane>
          ),
          due: <Pane kicker="Did it work?">A thrown error or a timeout counts as a failure. Anything else is done.</Pane>,
        }}
        src={`
flow
row: add . .
row: jobs claim .
row: worker due ok
lane "Your app" {orange} : add
lane "Ferry" {teal} : jobs claim
lane "Workers" {purple} : worker due ok
play: add jobs claim worker due ok
add <io> "New job" [Send] {orange} : kind and payload
jobs <store> "jobs table" [Database] {teal} : Postgres
claim <step> "Claim" [Key] {teal} : a 30 s lease
worker <round> "Worker" [Cog] {purple}
due <decide> "Did it work?" {purple}
ok <pill> "Done" [Check] {green} : \`state = 'done'\`
add -> jobs [Package]
jobs -> claim
claim -> worker [Key]
worker -> due
due -> ok "yes"
due ~> jobs "retry later" @right [Repeat]
`}
      />

      <Chapter s={S.loop} />
      <p>Each worker runs one loop: claim a job, run it, record what happened, and go again.</p>

      <Diagram
        title="The loop"
        caption="Three laps of one worker. Between jobs it waits a second if the table had nothing due."
        src={`
cycle
laps: 3
center: "job"
end: "idle"
claim "Claim" [Key] {teal} : oldest due job
run "Run" [Cog] {purple}
record "Record" [ClipboardList] {blue} : done or failed
`}
      />

      <Sub s={S.claim} />
      <p>
        A lock lasts as long as the connection that holds it, so a worker that hangs can hold a job forever. A lease
        has an end time written on the row. If the worker hasn&apos;t finished by then, any other worker can take the
        job.
      </p>
      <p>A simplified version of the claim, as one query:</p>

      <Code lang="ts" label="claim.ts" mark="4-6" caption="SKIP LOCKED lets two workers claim at once without waiting on each other.">{`
        export async function claim(db: Db, worker: string) {
          const [job] = await db.query(\`
            UPDATE jobs SET worker = $1,
              lease_until = now() + interval '30 seconds'
            WHERE id = (SELECT id FROM jobs WHERE run_at <= now()
              AND lease_until < now() FOR UPDATE SKIP LOCKED LIMIT 1)
            RETURNING *\`, [worker]);
          return job ?? null;
        }
      `}</Code>

      <p>
        A long job renews its lease every ten seconds. The row it renews looks like this; <code>lease_until</code> is
        the only field a crash leaves stale, and time fixes it.
      </p>

      <Code lang="json" label="a claimed job">{`
        {
          "id": "j_4813",
          "kind": "resize",
          "payload": { "upload": "u_2207", "width": 400 },
          "worker": "w-2",
          "lease_until": "2026-10-03T14:02:31Z",
          "tries": 1
        }
      `}</Code>

      <Sub s={S.retry} />
      <p>
        A job that fails is not retried at once. It waits, and the wait doubles with each try: two seconds, then four,
        then eight. After five tries it stops and is marked <code>failed</code>, with its last error kept on the row.
      </p>

      <Diagram
        title="Five tries, then stop"
        caption="Each failure adds a try. Retries go round the outside; the fifth failure leaves for good."
        src={`
flow
row: run ok .
row: wait fail stop
group "One try" [Repeat] {purple} : run ok
run <step> "Run" [Cog] {purple}
ok <decide> "Worked?" {purple}
fail <decide> "Five tries?" {orange}
wait <doc> "Wait" [Hourglass] {blue} : doubles
stop <pill> "Failed" [CircleX] {red} : the error is kept
run -> ok
ok -> fail "no"
fail -> stop "yes"
fail -> wait "no"
wait ~> run "again" @left [Repeat]
`}
      />

      <Diagram
        title="Tries per job kind"
        caption="Average attempts before a job finished or stopped, over a week."
        src={`
bars
unit: attempts
max: 5
Resize [Image] {teal} | 1 | almost never fails
Email [Mail] {blue} | 2
Webhook [Webhook] {orange} | 4 | other people's servers
`}
      />

      <p>Your app adds jobs with a client. A simplified Python client:</p>

      <Code lang="py" label="client.py" mark="3" caption="The worker reads max_tries from the row, so each kind can set its own.">{`
        def add(kind, payload, max_tries=5):
            # one row per job; workers find it by run_at
            return db.insert("jobs", kind=kind, payload=payload, max_tries=max_tries)

        add("resize", {"upload": "u_2207", "width": 400})
      `}</Code>

      <Hood s={S.schedule}>
        <p>
          The schedule is small enough to model on its own. The team kept a tiny model in Racket and checked it against
          the worker&apos;s waits in a test.
        </p>
        <Code lang="rkt" label="backoff.rkt">{`
          (define (wait-for tries)
            ; 2, 4, 8, 16 seconds, never more than a minute
            (min 60 (expt 2 tries)))
          (check-expect (map wait-for '(1 2 3 4)) '(2 4 8 16))
        `}</Code>
        <p>To run the workers locally:</p>
        <Code lang="sh">{`
          # two workers, verbose logs
          FERRY_WORKERS=2 npx ferry work --verbose
        `}</Code>
      </Hood>

      <Chapter s={S.life} />
      <p>One resize job from a real day, traced through the table:</p>

      <Diagram
        title="A job that failed once"
        caption="Times are from the job's row. The first try hit a timeout; the second finished."
        src={`
timeline
0.0 s | "Added" [Send] {orange} | by the upload handler
0.1 s | "Claimed" [Key] {teal} | lease to 30 s
30.1 s | "Lease ran out" [Timer] {red} | the worker hung
32.1 s | "Claimed again" [Key] {teal} | by another worker
32.9 s | "Done" [Check] {green} | thumbnail saved
`}
      />

      <p>
        The same day, sped up. A batch of uploads arrives at once, and the workers clear it in under four minutes.
      </p>

      <Diagram
        title="Clearing a batch"
        caption="Four minutes of one afternoon in a few seconds. Each mark is a moment from the logs."
        src={`
clock
to: 3:40
done: "clear"
at 0:05 "Batch arrives" [Inbox] {orange} : 1,200 uploads
at 0:40 "All workers busy" [Cog] {purple}
at 2:10 "Half done" [Gauge] {blue}
at 3:40 "Queue empty" [Check] {green}
`}
      />

      <Mosaic
        items={[
          { label: "harbour", front: harbour, back: harbourOut },
          { label: "orchard", front: orchard, back: orchardOut },
          { label: "skyline", front: skyline, back: skylineOut },
          { label: "meadow", front: meadow, back: meadowOut },
          { label: "lantern", front: lantern, back: lanternOut },
          { label: "glacier", front: glacier, back: glacierOut },
        ]}
      />

      <Chapter s={S.speed} />
      <p>
        Leases fixed the lost jobs but made claims slower: under load, a job waited almost five seconds before a worker
        took it. Three changes brought the wait back down.
      </p>

      <Diagram
        title="Three changes"
        caption="The 95th-percentile wait before a worker claims a job, in seconds, on the same batch."
        src={`
tune
from: 4.8
to: 0.3
label: p95 wait, seconds
done: "under a second"
lever "Index on run_at" [Search] {teal} : a scan became a lookup
lever "SKIP LOCKED" [Lock] {purple} : claims stopped queueing
lever "Wake on insert" [Bell] {orange} : no more polling gaps
`}
      />

      <Diagram
        title="Where the time went"
        caption="Median claim time for each version, in milliseconds."
        src={`
bars
unit: ms
mark: 100 "target"
In memory {gray} | 3 | fast, and lossy
Leases, first try {red} | 480 | a scan per claim
With the index {yellow} | 140
All three {green} | 35 | what runs today
`}
      />

      <Diagram
        title="A worker's afternoon"
        caption="When each worker was busy during the batch. Gaps are claims."
        src={`
bars
format: clock
max: 3:40
w-1 | 0:05..1:10 {purple}, 1:12..2:30 {purple}, 2:31..3:35 {purple}
w-2 | 0:20..1:50 {purple}, 1:52..3:40 {purple}
w-3 | 0:40..2:00 {teal}, 2:02..3:20 "resizes" {teal}
`}
      />

      <Figure bare title="Before and after" caption="The same hour of traffic, a week apart.">
        <Stats
          items={[
            { value: "9", label: "jobs lost per day, before", tone: "red" },
            { value: "0", label: "jobs lost per day, after", tone: "green" },
            { value: "0.3 s", label: "p95 wait for a worker", tone: "teal" },
          ]}
        />
      </Figure>

      <Figure bare wide title="The dashboard, a week apart" caption="Queue depth over an hour: climbing before leases, flat after.">
        <Pair
          before={dashBefore}
          after={dashAfter}
          beforeAlt="A dashboard with queue depth climbing and nine jobs lost."
          afterAlt="The same dashboard with a flat queue and no lost jobs."
          beforeLabel="In memory"
          afterLabel="Leases"
          beforeIcon="TrendingUp"
          afterIcon="Check"
        />
      </Figure>

      <Figure bare title="The jobs page" caption="Every row is a job; its state comes straight from the table.">
        <Shot contain src={jobs} alt="A table of jobs with their kind, state, tries and duration." />
      </Figure>

      <Chapter s={S.light} />
      <p>
        The team also built a small light for the office shelf. It reads the dashboard&apos;s numbers and shows one
        colour: green when the queue is healthy, yellow when it is busy, red when a job has failed.
      </p>

      <Figure bare title="The status light" caption="Three faces show a state; the back has the cable. Press a name to turn it yourself.">
        <Turntable
          frames={[lightFront, lightRight, lightBack, lightLeft]}
          alt="A small white status light"
          label="Shelf light, about 8 cm tall"
          sides={["Healthy", "Busy", "Back", "Failed"]}
        />
      </Figure>

      <Figure bare title="Where it started" caption="Whiteboard sketches from the first day.">
        <Polaroids
          items={[
            { src: sketch1, alt: "A sketch of three boxes joined by arrows.", label: "first draft" },
            { src: sketch2, alt: "A sketch of the lease idea.", label: "with leases" },
            { src: sketch3, alt: "A sketch of the retry loop.", label: "retry loop" },
          ]}
        />
      </Figure>

      <Chapter s={S.limits} />
      <p>Ferry is small on purpose, and some things are out of reach for now.</p>
      <Points>
        <Point icon="Repeat" tone="orange" title="At least once">
          A job can run twice if a lease runs out just as it finishes, so every job must be safe to repeat.
        </Point>
        <Point icon="Database" tone="blue" title="One database">
          Past a few thousand jobs a second, one Postgres table becomes the limit.
        </Point>
      </Points>
      <p>Next on the list:</p>
      <ul>
        <li>Priorities, so an urgent job can skip the queue.</li>
        <li>A way to cancel a job that is waiting to retry.</li>
      </ul>

      <Quote who="Ada, on the first week">The bug wasn&apos;t in any one line. It was in deleting a row before the work was done.</Quote>

      <Beat>A job leaves the table only when it is finished.</Beat>
    </>
  );
}
