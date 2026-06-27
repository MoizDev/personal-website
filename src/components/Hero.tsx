function Tag({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span className="tag" style={{ background: color }}>
      {children}
    </span>
  );
}

export function Hero() {
  return (
    <section id="me" className="pt-2">
      <h1
        className="hero-rise inline-block text-[clamp(1.75rem,6vw,4.5rem)] font-normal leading-[0.95] tracking-tight [font-family:var(--font-serif)]"
        style={{
          ["--i" as string]: 1,
          backgroundImage:
            "linear-gradient(115deg, var(--fg) 38%, color-mix(in srgb, var(--fg) 12%, transparent) 92%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        moiz
        <br />
        hashmi
      </h1>

      {/* wrapper carries the entrance animation so the inner nudge survives */}
      <div className="hero-rise" style={{ ["--i" as string]: 2 }}>
        <p className="mt-6 flex translate-y-[7px] flex-wrap items-center gap-x-2 gap-y-1 text-xl font-medium md:text-2xl">
          <span
            className="mark"
            style={{ ["--mark-color" as string]: "#ffe066" }}
          >
            Computer Science
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uw_logo.png"
            alt="University of Waterloo"
            className="inline-block h-[0.85em] w-auto"
          />
          <span>@UWaterloo</span>
        </p>
      </div>

      <p
        className="hero-rise mt-[1.85rem] text-xl font-semibold md:text-2xl"
        style={{ ["--i" as string]: 3 }}
      >
        i like building the abstractions most people just import.
      </p>

      <ul className="hero-stagger mt-7 space-y-3 text-[0.8rem] leading-relaxed md:text-[0.9rem]">
        <li>
          <Caret /> co-founded <Tag color="#ffe2bf">factful</Tag>, an ai edtech
          startup — turned down a $750k vc offer, now piloting with 70k seneca
          students
        </li>
        <li>
          <Caret /> built <Tag color="#dbe9ff">weekloom</Tag> — a 2d to-do list
          that works like a gantt chart; scaled to 30k users and 6-figure arr
        </li>
        <li>
          <Caret /> prev. swe at <Tag color="#ffd6d6">jazzba</Tag> — refactored
          a legacy enterprise warehouse platform, rewriting backend services and
          the api layer behind 1000s of skus/day
        </li>
        <li>
          <Caret /> grew a school club into <Tag color="#d4f7d4">scire</Tag> — a
          full-stack scheduling app now serving two school boards
        </li>
        <li>
          <Caret /> built <Tag color="#ece0ff">wmoj</Tag>, an online judge
          grading c++/python for 200+ concurrent users
        </li>
        <li>
          <Caret /> advised a school board on student innovation — pitched a
          policy that became a $5k founder grant
        </li>
        <li>
          <Caret /> tackled water scarcity by pulling water from thin air with
          piezoelectrics — bronze at <Tag color="#ededed">basef</Tag>
        </li>
      </ul>
    </section>
  );
}

function Caret() {
  return <span className="text-[var(--muted)]">&gt;</span>;
}
