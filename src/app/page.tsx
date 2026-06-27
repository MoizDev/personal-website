import { Sidebar } from "@/components/Sidebar";
import { Hero } from "@/components/Hero";
import { ImageArc } from "@/components/ImageArc";
import { Projects } from "@/components/Projects";
import { Reveal } from "@/components/Reveal";
import { Footer } from "@/components/Footer";
import { arcImages, projectImages } from "@/lib/images";

export default function Home() {
  return (
    <div className="relative overflow-x-hidden">
      {/* Sisyphus line art bleeding off the right edge of the site. Blended so
          its solid background drops out: light → invert + multiply; dark → screen. */}
      <div
        aria-hidden
        className="atlas-fade pointer-events-none absolute right-[-3rem] top-[10px] -z-10 select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sisyphus.png"
          alt=""
          className="h-[900px] w-auto -scale-x-100 opacity-[0.06] mix-blend-multiply [filter:invert(1)_blur(0.7px)] dark:opacity-[0.07] dark:mix-blend-screen dark:[filter:invert(0)_blur(0.7px)]"
        />
      </div>

      <div className="mx-auto max-w-[1100px] px-5 pt-16 sm:px-8 sm:pt-20">
        <div className="grid grid-cols-1 gap-x-12 lg:grid-cols-[210px_minmax(0,1fr)]">
          <Sidebar />
          <main className="relative max-w-[680px] pb-2 pt-2">
            <Hero />
          </main>
        </div>
      </div>

      <Reveal>
        <ImageArc images={arcImages} />
      </Reveal>

      <Projects images={projectImages} />

      <Footer />
    </div>
  );
}
