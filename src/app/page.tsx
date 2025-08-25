"use client";

import ProjectsShowcase, { ProjectTuple } from "./project_showcase";

const proj1: ProjectTuple = [
  "/factful-promo.jpg",
  "Factful: Integrated Writing Environment",
  "Factful is an integrated writing and research environment designed to help users eliminate factual errors and strengthen the credibility of their work. Unlike generic grammar checkers, Factful goes beyond spelling and style to actively cross-reference statements with trusted data sources, highlighting inconsistencies and suggesting corrections in real time. It’s built to empower students, professionals, and businesses who need writing that isn’t just polished, but accurate. With over 100,000 queries processed already, inbound VC interest, and upcoming pilots at scale, Factful represents a new standard in how knowledge is verified and communicated—bridging the gap between speed, clarity, and truth.",
  "Flask, React, Next.js, Typescript, Supabase",
  "https://www.youtube.com/watch?v=408bIVeZFjA",
];

const proj2: ProjectTuple = [
  "/tutor-promo.png",
  "WOSS Tutorapp",
  "Tutorapp is a web platform I built to streamline how tutoring clubs connect students with the right peer tutors across schools. Instead of relying on messy spreadsheets or manual sign-ups, Tutorapp automates the entire matching process—making it simple for students to request help, and for tutors to claim sessions instantly. Currently serving over 1,000+ students across the Halton school board, it provides a centralized hub where academic support is accessible, organized, and scalable. By reducing the overhead for club leaders and ensuring students get timely help, Tutorapp makes peer tutoring more efficient, impactful, and sustainable for both learners and mentors.",
  "Flask, React, Next.js, Typescript",
  "#",
]

const proj3: ProjectTuple = [
  "/plant-dex-promo.png",
  "PlantDex",
  "PlantDex is an AI-powered plant identification and care assistant that my team and I built in just 18 hours during a hackathon. We designed it to help users quickly identify plants by simply snapping a photo, after which the app provides details like species, care instructions, and growth needs. Using computer vision and external APIs for plant recognition, we combined a sleek interface with real-time results to make plant care accessible to anyone—from casual gardeners to enthusiasts. Despite the tight time frame, our team collaborated seamlessly, dividing tasks across frontend, backend, and API integration to deliver a working prototype that impressed judges with its practicality and user-friendly design.",
  "Flask, React, Next.js, Typescript",
  "#",
]



export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Menu bar */}
      <div className="font-[family-name:var(--font-inter)] flex flex-row gap-15 my-15 items-center justify-center mb-20 py-3 opacity-0 translate-y-[-20px] animate-[fadeInUp_0.3s_ease-out_0.05s_forwards]">
        <div className="flex flex-col gap-5 items-center mb-[-45]">
          <img src="logo.svg" alt="Logo" className="h-5" />
          <div className="flex flex-row gap-15 w-85 px-10 py-3 bg-[#2c2c2c] rounded-full items-center justify-center">
            <p>about</p>
            <p>projects</p>
            <p>writing</p>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="font-[family-name:var(--font-libre-baskerville)] flex flex-col justify-center items-center select-none">
        <h1 className="text-[80px] font-italic text-center opacity-0 translate-y-[-30px] animate-[fadeInUp_0.4s_ease-out_0.15s_forwards]">
          greetings,
        </h1>
        <video
          src="/eye.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="mb-[-10] pr-5 mt-[-25] opacity-0 translate-y-[-30px] animate-[fadeInUp_0.4s_ease-out_0.25s_forwards]"
        />
        <h1 className="text-[80px] opacity-0 translate-y-[-30px] animate-[fadeInUp_0.4s_ease-out_0.35s_forwards]">
          i&apos;m moiz<span className="force-white">.</span>
        </h1>
        <img
          src="/sisyphus.jpg"
          alt="Sisyphus artwork"
          className="mix-blend-screen w-125 mr-14 mt-[-270] opacity-0 translate-y-[-40px] animate-[fadeInUpSubtle_0.5s_ease-out_0.45s_forwards]"
        />
      </div>

      {/* Soft white glows — use transforms instead of negative offsets */}
      <div className="pointer-events-none absolute -top-[200px] left-0 -translate-x-1/3 bg-[#b5b5b5] w-90 h-90 rounded-full opacity-100 blur-[200px]" />
      <div className="pointer-events-none absolute -top-[200px] right-0 translate-x-1/3 bg-[#b5b5b5] w-90 h-90 rounded-full opacity-100 blur-[200px]" />

      {/* Content container that clips its own decorations */}
      <div className="relative mx-auto w-250 px-6">
        <div className="font-[family-name:var(--font-libre-baskerville)] text-[30px] mt-10 flex flex-col">
          <h1 className="ml-30">about me</h1>
          <p className="opacity-50 text-[20px] ml-30">
            i&apos;m a 17y/o high school student passionate about robotics, drones,
            machine learning and building things that matter. also sidequesting
            to make the panams in karate. i love f1, matcha and celsius. based
            close enough to toronto. this is my public notebook where i share my
            work, thoughts and experiences.
          </p>
        </div>

        <div className="font-[family-name:var(--font-libre-baskerville)] text-[30px] mt-20 flex flex-col">
          <h1 className="ml-30">what i&apos;ve been working on</h1>

          <p className="text-white/60 text-[20px] mt-5 ml-30">
            ↳ co-founded{" "}
            <img src="/factful.svg" alt="Factful logo" className="inline-block w-5 mb-1" />{" "}
            <span className="text-white opacity-100 underline underline-offset-3 decoration-[#a0a0a0] hover:bg-[#2DA761]/50 cursor-pointer">
              Factful
            </span>{" "}
            (100k+ queries processed, inbound VC interest from Seqouia, A16z,
            YC, others)
          </p>

          <p className="text-white/60 text-[20px] mt-5 ml-30">
            ↳ that same product was greenlit for $250k of{" "}
            <img src="/azure.png" alt="Azure logo" className="inline-block w-5 mb-1" />{" "}
            <span className="text-white opacity-100 underline underline-offset-3 decoration-[#a0a0a0] hover:bg-[#2DA761]/50 cursor-pointer">
              Azure Credits
            </span>{" "}
            by Microsoft startup fund
          </p>

          <p className="text-white/60 text-[20px] mt-5 ml-30">
            ↳ that same product will be piloting at a college (will disclose
            soon){" "}
            <img src="/luckyblock.png" alt="College logo" className="inline-block w-5.5 mb-1" />{" "}
            with over 40,000 students over 2026-2027
          </p>

          <p className="text-white/60 text-[20px] mt-5 ml-30">
            ↳ built{" "}
            <img src="/tutorapp.svg" alt="Tutorapp logo" className="inline-block w-6 mb-1" />{" "}
            <span className="text-white opacity-100 underline underline-offset-3 decoration-[#a0a0a0] hover:bg-[#2DA761]/50 cursor-pointer">
              Tutorapp
            </span>{" "}
            : a webapp to automate tutor-student connections for tutoring clubs
            across Halton (serves over 1,000+ students across the school board)
          </p>

          <p className="text-white/60 text-[20px] mt-5 ml-30">
            ↳ founded my schools podcast,{" "}
            <img src="/wossweekly.svg" alt="WOSS Weekly logo" className="inline-block w-6" />{" "}
            <span className="text-white opacity-100 underline underline-offset-3 decoration-[#a0a0a0] hover:bg-[#2DA761]/50 cursor-pointer">
              WOSS Weekly
            </span>{" "}
            : connecting the youth to various successful individuals in an
            attempt to bridge a knowledge gap through real insight
          </p>
        </div>

        {/* Decorative outlines inside a clipping context */}
        <div className="absolute w-100 h-150 border border-white rounded-full opacity-50 -left-[600px] top-[200px] pointer-events-none" />
        <div className="absolute w-30 h-30 border border-[2px] border-[#5772E1] rounded-full opacity-50 -left-[260px] top-[-200px] pointer-events-none" />
      </div>

      {/* Red ellipse — anchor at edge, move with transform (no layout overflow) */}
      <div className="pointer-events-none absolute w-100 h-150 border border-[#D6505A] rounded-full opacity-50 right-0 translate-x-1/2 top-[800px]" />

      <div className="flex font-[family-name:var(--font-libre-baskerville)] items-center justify-center mt-20">
        <div className="flex flex-col items-center text-[30px] mt-20">
          <h1 className="mb-10">Projects</h1>

          <ProjectsShowcase projects={[proj1, proj2, proj3]} />
          <div className="border border-b-white border-[1px] opacity-15 mt-20 w-100"/>
          <div className="flex flex-row gap-5 items-center mb-5">
            <p className="text-[15px] mt-5">2025 © Moiz Hashmi</p>

          </div>
        </div>
        
      </div>
    </div>
  );
}
