import { Outlet, useNavigation, useLocation } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/_layout";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import { ThemeProvider, useTheme } from "../contexts/theme-context";
import { getActiveCategories, type Category } from "../utils/categories";
import { getSiteSetting } from "../utils/site-settings";
import { getActivePagesBySection } from "../utils/pages";
import { logError } from "../utils/error-handler";
import type { Page } from "../types/db";

interface LoaderData {
  categories: Category[];
  siteDescription: string;
  pagesBySection: Record<string, Page[]>;
}

export function meta({ data }: Route.MetaArgs) {
  const siteDescription = data?.siteDescription || "개발자의 취향과 기록";
  return [
    { title: `SIDE B | ${siteDescription}` },
    {
      name: "description",
      content:
        "기술(Tech), 자동차(Mobility), 자산(Asset), 그리고 내면(Inner Side)에 대한 기록.",
    },
  ];
}

export async function loader(): Promise<LoaderData> {
  try {
    const [categories, siteDescription, pagesBySection] = await Promise.all([
      getActiveCategories(),
      getSiteSetting("site_description"),
      getActivePagesBySection(),
    ]);
    return { 
      categories,
      siteDescription: siteDescription || "개발자의 취향과 기록",
      pagesBySection,
    };
  } catch (error) {
    logError(error, { component: "Layout", action: "loadCategories" });
    // Return empty array on error - components will handle gracefully
    return { 
      categories: [],
      siteDescription: "개발자의 취향과 기록",
      pagesBySection: {},
    };
  }
}

function LayoutContent({ loaderData }: Route.ComponentProps) {
  const { theme, toggleTheme } = useTheme();
  const { categories, siteDescription, pagesBySection } = loaderData;
  const navigation = useNavigation();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Detect navigation state changes
  useEffect(() => {
    const isActive = navigation.state === "loading" || navigation.state === "submitting" || 
                     (navigation.location && navigation.location.pathname !== location.pathname);
    
    if (isActive) {
      setIsNavigating(true);
    } else if (navigation.state === "idle" && isNavigating) {
      // When navigation completes, hide loading after a short delay
      // This ensures the loading indicator is visible even for fast navigations
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [navigation.state, navigation.location, location.pathname, isNavigating]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-[#111111] dark:text-gray-100 transition-colors">
      <Header
        isDark={theme === "dark"}
        onThemeToggle={toggleTheme}
        categories={categories}
      />
      {/* Navigation Loading Indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-800">
          <div className="h-full bg-[#8B7355] dark:bg-[#A0826D] animate-pulse" style={{ width: "100%" }}>
            <div className="h-full bg-gradient-to-r from-[#8B7355] via-[#A0826D] to-[#8B7355] dark:from-[#A0826D] dark:via-[#C4A484] dark:to-[#A0826D] animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
          </div>
        </div>
      )}
      <main className="flex-1 relative">
        {isNavigating && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#8B7355] dark:border-[#A0826D] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        )}
        <Outlet />
      </main>
      <Footer categories={categories} siteDescription={siteDescription} pagesBySection={pagesBySection} />
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

