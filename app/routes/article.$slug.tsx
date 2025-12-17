import { Link } from "react-router";
import { data } from "react-router";
import { useTheme } from "../contexts/theme-context";
import type { Route } from "./+types/article.$slug";
import { getCategoryBySlug, type Category } from "../utils/categories";
import { Button } from "../components/ui/button";
import type { Post } from "../types/db";
import { getPostBySlug } from "../utils/supabase";
import { markdownToHtml } from "../utils/markdown";
import { formatDateKST } from "../utils/date";
import { handleImageError } from "../utils/image";
import { createAuthorSlug } from "../utils/slug";

interface LoaderData {
  article: Post;
  category: Category | null;
}

export function meta({ params, data }: Route.MetaArgs) {
  const article = data?.article;
  if (!article) {
    return [{ title: "기사를 찾을 수 없습니다 | SIDE B" }];
  }
  return [
    { title: `${article.title} | SIDE B` },
    {
      name: "description",
      content: article.subtitle,
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs): Promise<LoaderData> {
  const slug = params.slug;

  if (!slug) {
    throw data(null, { status: 404 });
  }

  const article = await getPostBySlug(slug);

  if (!article) {
    throw data(null, { status: 404 });
  }

  // Load category in parallel
  const category = await getCategoryBySlug(article.category);

  return {
    article,
    category,
  };
}

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  const { article, category } = loaderData;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Adjust background color for dark mode
  // If a custom background color is set, we need to ensure text is visible
  const getBackgroundColor = () => {
    if (!article.background_color) {
      return isDark ? "#1a1a1a" : "#faf9f6";
    }
    // In dark mode, if background is light, use a darker version
    if (isDark) {
      try {
        // Check if background is light (brightness > 128)
        const hex = article.background_color.replace("#", "").trim();
        if (hex.length === 6) {
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness > 128) {
            // Light background in dark mode - use darker version
            return "#1a1a1a";
          }
        }
      } catch (e) {
        // If parsing fails, use dark background
        return "#1a1a1a";
      }
    }
    return article.background_color;
  };
  
  const backgroundColor = getBackgroundColor();
  
  // Calculate button colors based on background brightness
  const getButtonColors = () => {
    try {
      const hex = backgroundColor.replace("#", "").trim();
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        if (brightness > 128) {
          // Light background - use dark button with white text
          return "!bg-[#111111] !text-white !border-[#111111] hover:!bg-[#333333]";
        } else {
          // Dark background - use white outline button
          return "!bg-transparent !text-white !border-white hover:!bg-white/10";
        }
      }
    } catch (e) {
      // Fallback
    }
    
    // Default based on theme
    return isDark
      ? "!bg-transparent !text-white !border-white hover:!bg-white/10"
      : "!bg-[#111111] !text-white !border-[#111111] hover:!bg-[#333333]";
  };
  
  const buttonClassName = getButtonColors();

  return (
    <article className="w-full min-h-screen">
      {/* Hero Section - Two Column Layout */}
      <section className="w-full min-h-screen flex flex-col lg:flex-row bg-white dark:bg-gray-900 transition-colors">
        {/* Left Column - Cover Image */}
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-screen relative overflow-hidden bg-gray-100 dark:bg-gray-800">
          {article.cover_image && article.cover_image.trim() !== "" ? (
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <span className="text-sm uppercase tracking-wider font-mono">
                {category?.label || "IMAGE"}
              </span>
            </div>
          )}
        </div>

        {/* Right Column - Text Content */}
        <div 
          className="w-full lg:w-1/2 flex flex-col px-6 md:px-8 lg:px-12 py-12 md:py-16 lg:py-24"
          style={{
            backgroundColor: backgroundColor,
          }}
        >
          <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full">
            {/* Top Section */}
            <div className="flex-1 flex flex-col">
              {/* Category */}
              {category && (
                <div className="mb-6 md:mb-8">
                  <Link
                    to={`/${category.slug}`}
                    className={`text-xs font-bold uppercase tracking-wider hover:opacity-70 transition-opacity ${
                      isDark ? "text-gray-100" : "text-[#111111]"
                    }`}
                  >
                    {category.label}
                  </Link>
                </div>
              )}

              {/* Title */}
              <h1 className={`text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight mb-4 md:mb-6 underline decoration-2 underline-offset-4 ${
                isDark ? "text-gray-100" : "text-[#111111]"
              }`}>
                {article.title}
              </h1>

              {/* Subtitle */}
              {article.subtitle && (
                <p className={`text-base md:text-lg lg:text-xl leading-relaxed mb-6 md:mb-8 ${
                  isDark ? "text-gray-100" : "text-[#111111]"
                }`}>
                  {article.subtitle}
                </p>
              )}

              {/* Date */}
              <time
                dateTime={article.created_at}
                className={`text-sm mb-8 md:mb-12 ${
                  isDark ? "text-gray-100" : "text-[#111111]"
                }`}
              >
                {formatDateKST(article.created_at)}
              </time>
            </div>

            {/* Bottom Section - Author Profile */}
            {article.author && (
              <Link
                to={`/${article.author.slug || createAuthorSlug(article.author.display_name)}`}
                className="flex items-center gap-3 pt-8 border-t border-gray-200 dark:border-gray-800 hover:opacity-70 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 ring-1 ring-gray-300 dark:ring-gray-600">
                  {article.author.profile_image_url ? (
                    <img
                      src={article.author.profile_image_url}
                      alt={article.author.display_name}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                      <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {article.author.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div className={`text-sm font-medium ${
                    isDark ? "text-gray-100" : "text-[#111111]"
                  }`}>
                    {article.author.display_name}
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Article Content */}
      <div 
        className="w-full py-16 md:py-24 px-6 transition-colors"
        style={{
          backgroundColor: backgroundColor,
        }}
      >
        <div className="container mx-auto max-w-3xl">
          <div
            className="prose prose-lg prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-[#111111] dark:prose-headings:text-gray-100 prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6 prose-ul:my-6 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:leading-relaxed prose-code:text-[#2563eb] dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-strong:text-[#111111] dark:prose-strong:text-gray-100 prose-strong:font-semibold prose-img:rounded-lg prose-img:my-4"
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(article.content),
            }}
          />
        </div>
      </div>

      {/* Footer Navigation */}
      <footer 
        className="w-full py-12 px-6 transition-colors"
        style={{
          backgroundColor: backgroundColor,
        }}
      >
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            {category && (
              <Button 
                variant="outline"
                asChild
                className={buttonClassName}
              >
                <Link to={`/${category.slug}`} className="no-underline">
                  카테고리로 돌아가기
                </Link>
              </Button>
            )}
            <Button 
              variant="outline"
              asChild
              className={buttonClassName}
            >
              <Link to="/" className="no-underline">
                홈으로 돌아가기
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </article>
  );
}
