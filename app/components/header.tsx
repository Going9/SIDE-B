import { NavLink } from "react-router";
import { useState } from "react";
import type { Category } from "../utils/categories";

interface HeaderProps {
  isDark: boolean;
  onThemeToggle: () => void;
  categories: Category[];
}

export function Header({ isDark, onThemeToggle, categories }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm transition-colors">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <NavLink
            to="/"
            className="text-xs md:text-2xl font-mono md:font-bold text-gray-500 dark:text-gray-400 md:text-[#111111] md:dark:text-gray-100 tracking-tight hover:opacity-80 transition-opacity"
          >
            <span className="md:hidden">SIDE B</span>
            <span className="hidden md:inline">SIDE B</span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {categories.map((category) => (
              <NavLink
                key={category.slug}
                to={`/${category.slug}`}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[#111111] dark:text-gray-100 border-b-2 border-[#111111] dark:border-gray-100 pb-1"
                      : "text-gray-600 dark:text-gray-400 hover:text-[#111111] dark:hover:text-gray-100 hover:border-b-2 hover:border-gray-300 dark:hover:border-gray-600 pb-1"
                  }`
                }
              >
                {category.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-600 dark:text-gray-400 hover:text-[#111111] dark:hover:text-gray-100 transition-colors"
              aria-label="메뉴 열기"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onThemeToggle}
              className="text-xs font-mono text-gray-500 dark:text-gray-400 hover:text-[#111111] dark:hover:text-gray-100 transition-colors uppercase tracking-wider"
              suppressHydrationWarning
            >
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-800 pt-4">
            <div className="flex flex-col gap-4">
              {categories.map((category) => (
                <NavLink
                  key={category.slug}
                  to={`/${category.slug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors py-2 ${
                      isActive
                        ? "text-[#111111] dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400 hover:text-[#111111] dark:hover:text-gray-100"
                    }`
                  }
                >
                  {category.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
