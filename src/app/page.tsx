"use client";

import { useState, useRef, useEffect } from "react";
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
];

const proj3: ProjectTuple = [
  "/plant-dex-promo.png",
  "PlantDex",
  "PlantDex is an AI-powered plant identification and care assistant that my team and I built in just 18 hours during a hackathon. We designed it to help users quickly identify plants by simply snapping a photo, after which the app provides details like species, care instructions, and growth needs. Using computer vision and external APIs for plant recognition, we combined a sleek interface with real-time results to make plant care accessible to anyone—from casual gardeners to enthusiasts. Despite the tight time frame, our team collaborated seamlessly, dividing tasks across frontend, backend, and API integration to deliver a working prototype that impressed judges with its practicality and user-friendly design.",
  "Flask, React, Next.js, Typescript",
  "#",
];

function AnimatedMenu() {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 });
  const menuItemsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const menuItems = ["about", "projects"];

  const updatePillPosition = (item: string) => {
    const element = menuItemsRef.current[item];
    const container = containerRef.current;

    if (element && container) {
      const containerRect = container.getBoundingClientRect();

      // Fixed spacing from all edges - this ensures perfect consistency
      const fixedMargin = 8; // Exact same margin from all edges (px-2 py-2 = 8px)

      // Calculate available width for pill
      const availableWidth = containerRect.width - fixedMargin * 2;

      // For 2 items, each gets half the available width
      const sectionWidth = availableWidth / menuItems.length;
      const itemIndex = menuItems.indexOf(item);

      // Pill takes up most of its section with small gaps between sections
      const gapBetweenSections = 8;
      const pillWidth = sectionWidth - gapBetweenSections;

      // Position pill in its section
      const sectionLeft = fixedMargin + itemIndex * sectionWidth;
      const pillLeft = sectionLeft + gapBetweenSections / 2;

      setPillStyle({
        width: pillWidth,
        left: pillLeft,
      });
    }
  };

  useEffect(() => {
    // Only update pill position if there's an active item
    if (activeItem) {
      const timer1 = setTimeout(() => updatePillPosition(activeItem), 50);
      const timer2 = setTimeout(() => updatePillPosition(activeItem), 150);
      const timer3 = setTimeout(() => updatePillPosition(activeItem), 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [activeItem]);

  // Add resize observer to recalculate on any layout changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !activeItem) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => updatePillPosition(activeItem), 10);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeItem]);

  // Remove scroll spy functionality - only manual selection now

  const smoothScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Get the actual position of the element
      const rect = element.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const elementTop = rect.top + scrollTop;

      // Different offsets for different sections
      const offset = sectionId === "about" ? 150 : 100;
      const targetPosition = elementTop - offset;

      window.scrollTo({
        top: Math.max(0, targetPosition), // Ensure we don't scroll to negative position
        behavior: "smooth",
      });
    }
  };

  const handleItemClick = (item: string) => {
    // 1. First, update active item and move pill immediately
    setActiveItem(item);
    setTimeout(() => updatePillPosition(item), 10);

    // 2. Then, after pill animation completes, start scrolling
    setTimeout(() => {
      smoothScrollToSection(item);
    }, 350); // Wait for pill animation (300ms) + small buffer
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-row px-2 py-2 bg-[#2c2c2c] rounded-full items-center justify-between min-w-[310px]"
    >
      {/* Animated pill background - only show when there's an active item */}
      {activeItem && (
        <div
          className="absolute bg-[#1a1a1a] rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${pillStyle.width}px`,
            left: `${pillStyle.left}px`,
            height: `calc(100% - 16px)`, // 8px margin top and bottom
            top: `8px`, // 8px from top
          }}
        />
      )}

      {/* Menu items */}
      {menuItems.map((item) => (
        <button
          key={item}
          ref={(el) => {
            menuItemsRef.current[item] = el;
          }}
          onClick={() => handleItemClick(item)}
          className={`relative z-10 px-8 py-3 text-base flex-1 transition-colors duration-200 ${
            activeItem === item
              ? "text-white font-medium"
              : "text-gray-300 hover:text-white"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Menu bar */}
      <div className="font-[family-name:var(--font-inter)] flex flex-row gap-15 my-15 items-center justify-center mb-20 py-3 opacity-0 translate-y-[-20px] animate-[fadeInUp_0.3s_ease-out_0.05s_forwards]">
        <div className="flex flex-col gap-5 items-center mb-[-45]">
          <img src="logo.svg" alt="Logo" className="h-5" />
          <AnimatedMenu />
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
      <div className="relative mx-auto max-w-4xl px-6">
        <div
          id="about"
          className="font-[family-name:var(--font-libre-baskerville)] mt-10 flex flex-col items-center"
        >
          <div className="max-w-3xl text-left">
            <h1 className="text-clamp(24px,5vw,30px) mb-4">about me</h1>
            <p className="opacity-50 text-clamp(16px,3.5vw,20px)">
              i&apos;m a 17y/o high school student passionate about robotics,
              drones, machine learning and building things that matter. also
              sidequesting to make the panams in karate. i love f1, matcha and
              celsius. based close enough to toronto. this is my public notebook
              where i share my work, thoughts and experiences.
            </p>
          </div>
        </div>

        <div className="font-[family-name:var(--font-libre-baskerville)] mt-20 flex flex-col items-center">
          <div className="max-w-3xl text-left">
            <h1 className="text-clamp(24px,5vw,30px) mb-6">
              what i&apos;ve been working on
            </h1>

            <div className="space-y-4">
              <p className="text-white/60 text-clamp(14px,3vw,20px)">
                ↳ co-founded{" "}
                <img
                  src="/factful.svg"
                  alt="Factful logo"
                  className="inline-block w-5 mb-1"
                />{" "}
                <span className="text-white opacity-100 underline underline-offset-3 decoration-[#a0a0a0] hover:bg-[#2DA761]/50 cursor-pointer">
                  Factful
                </span>{" "}
                (100k+ queries processed, inbound VC interest from Seqouia,
                A16z, YC, others)
              </p>

              <p className="text-white/60 text-clamp(14px,3vw,20px)">
                ↳ that same product was greenlit for $250k of{" "}
                <img
                  src="/azure.png"
                  alt="Azure logo"
                  className="inline-block w-5 mb-1"
                />{" "}
                <span className="text-white opacity-100 underline underline-offset-3 decoration-[#a0a0a0] hover:bg-[#2DA761]/50 cursor-pointer">
                  Azure Credits
                </span>{" "}
                by Microsoft startup fund
              </p>

              <p className="text-white/60 text-clamp(14px,3vw,20px)">
                ↳ that same product will be piloting at a college (will disclose
                soon){" "}
                <img
                  src="/luckyblock.png"
                  alt="College logo"
                  className="inline-block w-5.5 mb-1"
                />{" "}
                with over 40,000 students over 2026-2027
              </p>

              <p className="text-white/60 text-clamp(14px,3vw,20px)">
                ↳ built{" "}
                <img
                  src="/tutorapp.svg"
                  alt="Tutorapp logo"
                  className="inline-block w-6 mb-1"
                />{" "}
                <span className="text-white opacity-100 underline underline-offset-3 decoration-[#a0a0a0] hover:bg-[#2DA761]/50 cursor-pointer">
                  Tutorapp
                </span>{" "}
                : a webapp to automate tutor-student connections for tutoring
                clubs across Halton (serves over 1,000+ students across the
                school board)
              </p>

              <p className="text-white/60 text-clamp(14px,3vw,20px)">
                ↳ founded my schools podcast,{" "}
                <img
                  src="/wossweekly.svg"
                  alt="WOSS Weekly logo"
                  className="inline-block w-6"
                />{" "}
                <span className="text-white opacity-100 underline underline-offset-3 decoration-[#a0a0a0] hover:bg-[#2DA761]/50 cursor-pointer">
                  WOSS Weekly
                </span>{" "}
                : connecting the youth to various successful individuals in an
                attempt to bridge a knowledge gap through real insight
              </p>
            </div>
          </div>
        </div>

        {/* Decorative outlines inside a clipping context */}
        <div className="absolute w-100 h-150 border border-white rounded-full opacity-50 -left-[600px] top-[200px] pointer-events-none" />
        <div className="absolute w-30 h-30 border border-[2px] border-[#5772E1] rounded-full opacity-50 -left-[260px] top-[-200px] pointer-events-none" />
      </div>

      {/* Red ellipse — anchor at edge, move with transform (no layout overflow) */}
      <div className="pointer-events-none absolute w-100 h-150 border border-[#D6505A] rounded-full opacity-50 right-0 translate-x-1/2 top-[800px]" />

      <div
        id="projects"
        className="flex font-[family-name:var(--font-libre-baskerville)] items-center justify-center mt-20"
      >
        <div className="flex flex-col items-center text-[30px] mt-20">
          <h1 className="mb-10">Projects</h1>

          <ProjectsShowcase projects={[proj1, proj2, proj3]} />
          <div className="border border-b-white border-[1px] opacity-15 mt-20 w-100" />
          <div className="flex flex-row gap-5 items-center mb-5">
            <p className="text-[15px] mt-5">2025 © Moiz Hashmi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
