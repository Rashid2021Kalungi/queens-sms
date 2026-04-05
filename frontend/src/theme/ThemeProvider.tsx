import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";

const THEME_KEY = "junior_school_theme_pref";
const DENSITY_KEY = "junior_school_density";

type ThemeContextValue = {
  themePreference: ThemePreference;
  setThemePreference: (v: ThemePreference) => void;
  resolvedTheme: "light" | "dark";
  density: Density;
  setDensity: (v: Density) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "light";
}

function readStoredDensity(): Density {
  try {
    const v = localStorage.getItem(DENSITY_KEY);
    if (v === "comfortable" || v === "compact") return v;
  } catch {
    /* ignore */
  }
  return "comfortable";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>(readStoredTheme);
  const [density, setDensityState] = useState<Density>(readStoredDensity);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedTheme: "light" | "dark" =
    themePreference === "system"
      ? systemDark
        ? "dark"
        : "light"
      : themePreference;

  const setThemePreference = useCallback((v: ThemePreference) => {
    setThemePreferenceState(v);
    try {
      localStorage.setItem(THEME_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const setDensity = useCallback((v: Density) => {
    setDensityState(v);
    try {
      localStorage.setItem(DENSITY_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      themePreference,
      setThemePreference,
      resolvedTheme,
      density,
      setDensity,
    }),
    [
      themePreference,
      setThemePreference,
      resolvedTheme,
      density,
      setDensity,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
