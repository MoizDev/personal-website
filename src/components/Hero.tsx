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

      <ul className="hero-stagger mt-7 space-y-3 text-[0.75rem] leading-relaxed md:text-[0.84375rem]">
        <li>
          <Caret /> incoming{" "}
          <Tag color="#ffd6d6">@Startup</Tag>, prev{" "}
          <Tag color="#d4f7d4">@BigCo</Tag>
        </li>
        <li>
          <Caret /> launched{" "}
          <Tag color="#ffe2bf">Flux</Tag>, a tool for makers (1M+ users, early
          traction)
        </li>
        <li>
          <Caret /> growing a{" "}
          <Tag color="#ededed">builder</Tag> community @campus
        </li>
        <li>
          <Caret /> shipped products for{" "}
          <Tag color="#dbe9ff">Acme</Tag>{" "}
          <Tag color="#dbe9ff">Nova</Tag>{" "}
          <Tag color="#dbe9ff">Orbit</Tag>
        </li>
        <li>
          <Caret /> built{" "}
          <Tag color="#ffe2bf">PixelKit</Tag>, a design system generator for
          fast UI
        </li>
        <li>
          <Caret /> writing essays on{" "}
          <Tag color="#ece0ff">craft</Tag> &amp;{" "}
          <Tag color="#ece0ff">@moizbuilds</Tag>
        </li>
        <li>
          <Caret /> seeking summer 2027 internship opportunities
        </li>
      </ul>
    </section>
  );
}

function Caret() {
  return <span className="text-[var(--muted)]">&gt;</span>;
}
