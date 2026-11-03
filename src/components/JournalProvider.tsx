import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Moon, Sun } from "lucide-react";
import { getCategories, getSettings } from "../lib/api";
import {
  defaultSettings,
  fontFamily,
  type SiteSettings,
} from "../lib/preferences";
type JournalState = {
  categories: string[];
  settings: SiteSettings;
  theme: "dark" | "light";
  toggleTheme: () => void;
  reload: () => Promise<void>;
  settingsError: string;
};
const Context = createContext<JournalState | null>(null);
export function JournalProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState(["Uncategorized"]);
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsError, setError] = useState("");
  const [override, setOverride] = useState<"dark" | "light" | null>(() => {
    try {
      const v = localStorage.getItem("inkstone-theme");
      return v === "dark" || v === "light" ? v : null;
    } catch {
      return null;
    }
  });
  const theme = override || settings.default_theme;
  async function reload() {
    try {
      const [cats, prefs] = await Promise.all([getCategories(), getSettings()]);
      setCategories(cats);
      setSettings(prefs);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Journal settings could not be loaded.",
      );
    }
  }
  useEffect(() => {
    reload();
    const t = setInterval(reload, 30000);
    const refresh = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.setProperty(
      "--font-display",
      fontFamily(settings.heading_font),
    );
    document.documentElement.style.setProperty(
      "--font-body",
      fontFamily(settings.body_font),
    );
  }, [theme, settings]);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setOverride(next);
    try {
      localStorage.setItem("inkstone-theme", next);
    } catch {}
  }
  return (
    <Context.Provider
      value={{
        categories,
        settings,
        theme,
        toggleTheme,
        reload,
        settingsError,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useJournal() {
  const c = useContext(Context);
  if (!c) throw Error("JournalProvider missing");
  return c;
}
export function ThemeToggle() {
  const { theme, toggleTheme } = useJournal();
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={
        theme === "dark" ? "Switch to day mode" : "Switch to dark mode"
      }
      title={theme === "dark" ? "Switch to day mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      <span>{theme === "dark" ? "Day mode" : "Night mode"}</span>
    </button>
  );
}
