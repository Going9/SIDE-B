import { Link } from "react-router";
import type { Category } from "../utils/categories";

interface FooterProps {
  categories: Category[];
}

export function Footer({ categories }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 transition-colors">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <h3 className="text-lg font-bold text-[#111111] dark:text-gray-100 mb-4 tracking-tight">
              SIDE B
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              개발자의 취향과 기록
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#111111] dark:text-gray-100 mb-4 uppercase tracking-wider">
              카테고리
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    to={`/${category.slug}`}
                    className="hover:text-[#111111] dark:hover:text-gray-100 transition-colors"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#111111] dark:text-gray-100 mb-4 uppercase tracking-wider">
              정보
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  to="/about"
                  className="hover:text-[#111111] dark:hover:text-gray-100 transition-colors"
                >
                  소개
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-[#111111] dark:hover:text-gray-100 transition-colors"
                >
                  문의
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#111111] dark:text-gray-100 mb-4 uppercase tracking-wider">
              법적 고지
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-[#111111] dark:hover:text-gray-100 transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-[#111111] dark:hover:text-gray-100 transition-colors"
                >
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            © {currentYear} SIDE B. Designed & Developed with care.
          </p>
        </div>
      </div>
    </footer>
  );
}
