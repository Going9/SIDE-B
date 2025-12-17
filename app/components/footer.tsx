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
  // Filter out empty sections
  const nonEmptySections = Object.keys(pagesBySection).filter(
    (section) => section !== "카테고리" && pagesBySection[section]?.length > 0
  );

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

          {/* 동적 섹션들 */}
          {nonEmptySections.map((section) => {
            const pages = pagesBySection[section];

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
