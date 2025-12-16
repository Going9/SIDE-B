import { NavLink } from "react-router";
import { MENU_ITEMS } from "../config/navigation";

interface HeaderProps {
  isDark: boolean;
  onThemeToggle: () => void;
}

export function Header({ isDark, onThemeToggle }: HeaderProps) {
  const navLinks = MENU_ITEMS.map((item) => ({
    to: item.href,
    label: item.label,
  }));

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <NavLink
            to="/"
            className="text-2xl font-bold text-[#111111] tracking-tight hover:opacity-80 transition-opacity"
          >
            SIDE B
          </NavLink>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[#111111] border-b-2 border-[#111111] pb-1"
                      : "text-gray-600 hover:text-[#111111] hover:border-b-2 hover:border-gray-300 pb-1"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={onThemeToggle}
            className="text-xs font-mono text-gray-500 hover:text-[#111111] transition-colors uppercase tracking-wider"
          >
            {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </header>
  );
}
