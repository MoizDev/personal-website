import type { Metadata } from "next";
import {
  Inter,
  Anton,
  Libre_Baskerville,
  Noto_Nastaliq_Urdu,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Notch } from "@/components/Notch";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap",
});

const notoNastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-urdu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moiz Hashmi",
  description:
    "Moiz Hashmi — building at the intersection of software, design, and ideas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint — prevents the light→dark
            flash on full page loads. Defaults to light; never reads the OS. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${anton.variable} ${libreBaskerville.variable} ${notoNastaliq.variable} font-sans`}
      >
        <ThemeProvider>
          <Notch />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
