import type { Metadata } from "next";
import { Google_Sans, Libre_Baskerville } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Moiz Hashmi",
  description: "Computer Science at the University of Waterloo. A row of projects, one card each.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
