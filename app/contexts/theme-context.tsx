import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  
  const root = document.documentElement;
  
  // Remove both classes first to ensure clean state
  root.classList.remove("light", "dark");
  
  // Add the appropriate class
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.add("light");
  }
  
  // Save to localStorage
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {
    // Ignore localStorage errors (e.g., in private browsing)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage or system preference
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "light";
    
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    
    // Check system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };

  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    // Apply initial theme immediately
    applyTheme(theme);
  }, []);

  useEffect(() => {
    // Apply theme whenever it changes
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      return newTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

