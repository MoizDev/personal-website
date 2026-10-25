/**
 * Light and dark. The page reads `data-theme` on <html>; THEME_SCRIPT sets it
 * before first paint (the saved choice, else the system's), and toggleTheme
 * flips it and remembers the choice.
 */

export const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export function toggleTheme() {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const next = dark ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // storage blocked; the choice lasts until reload
  }
}
