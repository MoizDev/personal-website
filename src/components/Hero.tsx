import { SocialLinks } from "./SocialLinks";

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
      <div className="flex items-start justify-between gap-4">
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
        {/* top edge sits on the imaginary line off the top of "moiz" */}
        <SocialLinks className="hero-rise mt-[0.35rem] shrink-0" />
      </div>

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
          <Caret /> co-founded{" "}
          <Linked href="https://factful.io/">
            <Logo src="/factful.png" alt="Factful" em={1.35} />
            <Tag color="#ffe2bf">factful</Tag>
          </Linked>
          , an ai edtech startup: turned down a $750k vc offer, now piloting with
          70k seneca students
        </li>
        <li>
          <Caret /> built{" "}
          <Linked href="https://weekloom.com/">
            <Logo src="/weekloom-logo.svg" alt="Weekloom" />
            <Tag color="#dbe9ff">weekloom</Tag>
          </Linked>
          : a 2d to-do list that works like a gantt chart; scaled to 30k users
          with zero marketing spend
        </li>
        <li>
          <Caret /> prev. swe at{" "}
          <Linked href="https://jazzba.io/">
            <Logo src="/jazzba-logo.png" alt="Jazzba" em={1.05} />
            <Tag color="#ffd6d6">jazzba</Tag>
          </Linked>
          : broke a legacy warehouse monolith into containerized microservices on
          kubernetes, re-architecting the api layer behind 1000s of skus/day
        </li>
        <li>
          <Caret /> built{" "}
          <Linked href="https://wmoj.ca/">
            <Logo src="/wmoj.webp" alt="WMOJ" em={1.35} />
            <Tag color="#ece0ff">wmoj</Tag>
          </Linked>
          , an online judge powering board-wide computing competitions; grades
          c++/python for 200+ concurrent users
        </li>
        <li>
          <Caret /> grew a school club into{" "}
          <Linked href="https://app.tutoringapp.ca">
            <Logo src="/scire-logo.webp" alt="Scire" em={1.35} />
            <Tag color="#d4f7d4">scire</Tag>
          </Linked>
          : a full-stack scheduling app now serving two school boards
        </li>
        <li>
          <Caret /> advised a school board{" "}
          <Linked href="https://hdsb.ca/">
            <Logo src="/school-board-logo.png" alt="School board" em={1.35} />
          </Linked>{" "}
          on student innovation: pitched a policy that became a $5k founder grant
        </li>
        <li>
          <Caret /> tackled water scarcity by pulling water from thin air with
          piezoelectrics: bronze at{" "}
          <Linked href="https://www.basef.ca/">
            <Tag color="#ededed">basef</Tag>
          </Linked>
        </li>
      </ul>
    </section>
  );
}

function Caret() {
  return <span className="text-[var(--muted)]">&gt;</span>;
}

function Linked({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline transition-opacity hover:opacity-70"
    >
      {children}
    </a>
  );
}

function Logo({
  src,
  alt,
  em = 1.15,
  align = -0.22,
}: {
  src: string;
  alt: string;
  em?: number;
  align?: number;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      style={{ height: `${em}em`, verticalAlign: `${align}em` }}
      className="mr-1 inline-block w-auto rounded-[3px]"
    />
  );
}
