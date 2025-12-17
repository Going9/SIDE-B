import { Outlet } from "react-router";
import type { Route } from "./+types/_layout";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import { ThemeProvider, useTheme } from "../contexts/theme-context";
import { getActiveCategories, type Category } from "../utils/categories";
import { logError } from "../utils/error-handler";

interface LoaderData {
  categories: Category[];
}

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

export async function loader(): Promise<LoaderData> {
  try {
    const categories = await getActiveCategories();
    return { categories };
  } catch (error) {
    logError(error, { component: "Layout", action: "loadCategories" });
    // Return empty array on error - components will handle gracefully
    return { categories: [] };
  }
}

function LayoutContent({ loaderData }: Route.ComponentProps) {
  const { theme, toggleTheme } = useTheme();
  const { categories } = loaderData;

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

export default function Layout({ loaderData }: Route.ComponentProps) {
  return (
    <ThemeProvider>
      <LayoutContent loaderData={loaderData} />
    </ThemeProvider>
  );
}

