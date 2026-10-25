import type { Metadata } from "next";
import { Libre_Baskerville, Manrope } from "next/font/google";
import "./globals.css";

// Manrope is a variable font: one file covers every weight from 200 to 800.
// next/font sizes a local fallback to its metrics, so the swap doesn't shift text.
const sans = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const serif = Libre_Baskerville({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  // makes OG and Twitter image paths absolute; the apex domain redirects to www
  metadataBase: new URL("https://www.moizhashmi.com"),
  title: "Moiz Hashmi",
  description: "Computer Science at the University of Waterloo. A row of projects, one card each.",
};

// Runs before first paint so the page never flashes the wrong theme:
// the saved choice, else the system's.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script sets data-theme before React hydrates
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
