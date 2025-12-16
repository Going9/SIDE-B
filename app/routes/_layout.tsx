import { Outlet } from "react-router";
import { useState, useEffect } from "react";
import type { Route } from "./+types/_layout";
import { Header } from "../components/header";
import { Footer } from "../components/footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SIDE B | Editorial for Tech & Life" },
    {
      name: "description",
      content: "A modern lifestyle magazine exploring technology, mobility, systems, assets, and philosophy.",
    },
  ];
}

export default function Layout() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  function handleThemeToggle() {
    setIsDark((prev) => !prev);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111111]">
      <Header isDark={isDark} onThemeToggle={handleThemeToggle} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

