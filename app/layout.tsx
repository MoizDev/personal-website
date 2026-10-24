import type { Metadata } from "next";
import { Google_Sans, Libre_Baskerville } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const sans = Google_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  // next/font has no metrics for Google Sans, so it can't build a fallback
  adjustFontFallback: false,
});

const serif = Libre_Baskerville({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

// Paper Mono (paper.design/mono, SIL Open Font License), for the names on the cards
const mono = localFont({
  src: "../assets/fonts/PaperMono-Variable.woff2",
  variable: "--font-card",
  weight: "100 800",
});

export const metadata: Metadata = {
  title: "Moiz Hashmi",
  description: "Computer Science at the University of Waterloo. A row of projects, one card each.",
};

// Runs before first paint so the page never flashes the wrong theme:
// the saved choice, else the system's.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script sets data-theme before React hydrates
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
