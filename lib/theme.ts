/** Flip between light and dark, and remember the choice (read back by the script in app/layout.tsx). */
export function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // storage blocked; the choice lasts until reload
  }
}
