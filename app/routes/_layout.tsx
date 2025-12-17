import { Outlet } from "react-router";
import { useState, useEffect } from "react";
import type { Route } from "./+types/_layout";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import { ThemeProvider, useTheme } from "../contexts/theme-context";
import { getActiveCategories, type Category } from "../utils/categories";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SIDE B | 개발자의 취향과 기록" },
    {
      name: "description",
      content:
        "기술(Tech), 자동차(Mobility), 자산(Asset), 그리고 내면(Inner Side)에 대한 기록.",
    },
  ];
}

function LayoutContent() {
  const { theme, toggleTheme } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const activeCategories = await getActiveCategories();
        setCategories(activeCategories);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-[#111111] dark:text-gray-100 transition-colors">
      <Header
        isDark={theme === "dark"}
        onThemeToggle={toggleTheme}
        categories={categories}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer categories={categories} />
    </div>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}

