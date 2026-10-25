"use client";

import { Moon, Sun } from "lucide-react";
import { toggleTheme } from "@/lib/theme";

export function ThemeButton() {
  return (
    <button type="button" className="wu-theme" onClick={toggleTheme} aria-label="Switch light or dark mode">
      <Sun size={16} className="wu-sun" aria-hidden />
      <Moon size={16} className="wu-moon" aria-hidden />
    </button>
  );
}
