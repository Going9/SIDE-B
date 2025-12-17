import { Link, useNavigation } from "react-router";
import type { Category } from "../utils/categories";
import type { Page } from "../types/db";

interface FooterProps {
  categories: Category[];
  siteDescription: string;
  pagesBySection: Record<string, Page[]>;
}

export function Footer({
  categories,
  siteDescription,
  pagesBySection,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const navigation = useNavigation();

  // Get all sections except "카테고리" (which is handled separately)
  const sections = Object.keys(pagesBySection).filter(
    (section) => section !== "카테고리"
  );

  // Count non-empty sections
  const nonEmptySections = sections.filter((section) => {
    const pages = pagesBySection[section];
    return pages && pages.length > 0;
  });

  // Calculate total columns: 1 (SIDE B) + 1 (카테고리 if exists) + non-empty sections
  const totalColumns =
    1 + (categories.length > 0 ? 1 : 0) + nonEmptySections.length;

  // Use fixed grid that adapts to content
  // Always use max 4 columns for better layout
  const gridColsClass =
    totalColumns <= 1
      ? "md:grid-cols-1"
      : totalColumns <= 2
        ? "md:grid-cols-2"
        : totalColumns <= 3
          ? "md:grid-cols-3"
          : "md:grid-cols-4";

  return (
    <footer className="bg-black text-white py-16 transition-colors">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* SIDE B */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 tracking-tight">
              SIDE B
            </h3>
            <p className="text-sm text-white/70">{siteDescription}</p>
          </div>

          {/* 카테고리 섹션 */}
          {categories.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                카테고리
              </h4>
              <ul className="space-y-2 text-sm text-white/70">
                {categories.map((category) => {
                  const isPending =
                    navigation.state === "loading" &&
                    navigation.location?.pathname === `/${category.slug}`;
                  return (
                    <li key={category.slug}>
                      <Link
                        to={`/${category.slug}`}
                        className={`hover:text-white transition-all duration-200 flex items-center gap-2 ${
                          isPending ? "text-white/50" : ""
                        }`}
                      >
                        {category.label}
                        {isPending && (
                          <span className="inline-block w-1 h-1 bg-white rounded-full animate-pulse" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* 동적 섹션들 - 빈 섹션은 표시하지 않음 */}
          {nonEmptySections.map((section) => {
            const pages = pagesBySection[section];
            if (!pages || pages.length === 0) return null;

            return (
              <div key={section}>
                <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                  {section}
                </h4>
                <ul className="space-y-2 text-sm text-white/70">
                  {pages.map((page) => {
                    const isPending =
                      navigation.state === "loading" &&
                      navigation.location?.pathname === `/${page.slug}`;
                    return (
                      <li key={page.id}>
                        <Link
                          to={`/${page.slug}`}
                          className={`hover:text-white transition-all duration-200 flex items-center gap-2 ${
                            isPending ? "text-white/50" : ""
                          }`}
                        >
                          {page.title}
                          {isPending && (
                            <span className="inline-block w-1 h-1 bg-white rounded-full animate-pulse" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-sm text-white/60 text-center">
            © {currentYear} SIDE B. Designed & Developed with care.
          </p>
        </div>
      </div>
    </footer>
  );
}
