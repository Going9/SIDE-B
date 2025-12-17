import { Link } from "react-router";
import type { Route } from "./+types/_index";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import type { Post } from "../types/db";
import { getCategoryBySlug, type Category } from "../utils/categories";
import { getLatestPosts, getTotalPostsCount } from "../utils/supabase";
import { formatDateKST } from "../utils/date";

interface LoaderData {
  posts: Post[];
  categories: Record<string, Category | null>;
  currentPage: number;
  totalPages: number;
  totalPosts: number;
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

export async function loader({
  request,
}: Route.LoaderArgs): Promise<LoaderData> {
  try {
    // Get page from URL query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const currentPage = Math.max(1, page);

    // Get total posts count
    const totalPosts = await getTotalPostsCount();

    if (totalPosts === 0) {
      throw new Error(
        "No posts found in database. Please add posts to your Supabase 'posts' table."
      );
    }

    // Calculate posts to fetch
    // First page: 15 posts (3 sections)
    // Other pages: 5 posts (1 section)
    let limit: number;
    let offset: number;

    if (currentPage === 1) {
      limit = 15; // 3 sections
      offset = 0;
    } else {
      limit = 5; // 1 section
      offset = 15 + (currentPage - 2) * 5; // Skip first 15, then 5 per page
    }

    // Fetch posts
    const posts = await getLatestPosts(limit, offset);

    // Calculate total pages
    // First page has 15 posts, rest have 5 posts each
    const remainingPosts = Math.max(0, totalPosts - 15);
    const additionalPages = Math.ceil(remainingPosts / 5);
    const totalPages = remainingPosts > 0 ? 1 + additionalPages : 1;

    // Load categories for all posts
    const categorySlugs = new Set<string>();
    posts.forEach((post) => {
      categorySlugs.add(post.category);
    });

    const categories: Record<string, Category | null> = {};
    await Promise.all(
      Array.from(categorySlugs).map(async (slug) => {
        categories[slug] = await getCategoryBySlug(slug);
      })
    );

    return {
      posts,
      categories,
      currentPage,
      totalPages,
      totalPosts,
    };
  } catch (error) {
    // Re-throw with more context if it's a Supabase error
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          `Database error: ${error.message}\n\n` +
            `Please ensure:\n` +
            `1. Your Supabase project is active\n` +
            `2. The 'posts' table exists in your database\n` +
            `3. Your RLS policies allow read access`
        );
      }
    }
    throw error;
  }
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { posts, categories, currentPage, totalPages, totalPosts } =
    loaderData;

  // Group posts into sections of 5 (1 large + 4 small)
  const postGroups: Post[][] = [];
  for (let i = 0; i < posts.length; i += 5) {
    postGroups.push(posts.slice(i, i + 5));
  }

  // Render a single post card
  function renderPostCard(post: Post, isLarge: boolean = false) {
    const category = categories[post.category];

    if (isLarge) {
      // Large card: text overlay on image with gradient
      return (
        <Link
          key={post.id}
          to={`/article/${post.slug}`}
          className="block h-full group"
        >
          <article className="relative h-full overflow-hidden transition-all duration-300 hover:opacity-95">
            {/* Cover Image */}
            {post.cover_image && post.cover_image.trim() !== "" ? (
              <div className="relative w-full h-full aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                          <span class="text-xs uppercase tracking-wider font-mono text-gray-400 dark:text-gray-500">
                            ${category?.label || post.category}
                          </span>
                        </div>
                      `;
                    }
                  }}
                />
                {/* Gradient overlay - always visible */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

                {/* Text Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 lg:p-10">
                  {/* Category and Date */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-white/90 uppercase tracking-wider">
                      {category?.label || post.category}
                    </span>
                    <time
                      dateTime={post.created_at}
                      className="text-xs text-white/70"
                    >
                      {formatDateKST(post.created_at)}
                    </time>
                  </div>

                  {/* Title */}
                  <h2 className="font-semibold text-white leading-tight tracking-tight mb-3 text-2xl md:text-3xl lg:text-4xl">
                    {post.title}
                  </h2>

                  {/* Description */}
                  {post.description && (
                    <p
                      className="text-white/90 leading-relaxed text-base md:text-lg"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {post.description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full aspect-[4/5] bg-gray-200 dark:bg-gray-700">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <span className="text-xs uppercase tracking-wider font-mono">
                    {category?.label || post.category}
                  </span>
                </div>
              </div>
            )}
          </article>
        </Link>
      );
    } else {
      // Small card: larger image, smaller text
      return (
        <Link
          key={post.id}
          to={`/article/${post.slug}`}
          className="block h-full group"
        >
          <article className="h-full overflow-hidden transition-all duration-300 flex flex-col">
            {/* Cover Image - Larger proportion */}
            {post.cover_image && post.cover_image.trim() !== "" ? (
              <div className="relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[3/4]">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                          <span class="text-xs uppercase tracking-wider font-mono text-gray-400 dark:text-gray-500">
                            ${category?.label || post.category}
                          </span>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            ) : (
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 aspect-[3/4]">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <span className="text-xs uppercase tracking-wider font-mono">
                    {category?.label || post.category}
                  </span>
                </div>
              </div>
            )}

            {/* Content - Smaller proportion */}
            <div className="p-4 flex-1 flex flex-col">
              {/* Category and Date */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#666] dark:text-[#999] uppercase tracking-wider">
                  {category?.label || post.category}
                </span>
                <time
                  dateTime={post.created_at}
                  className="text-xs text-[#999] dark:text-[#666]"
                >
                  {formatDateKST(post.created_at)}
                </time>
              </div>

              {/* Title */}
              <h2 className="font-semibold text-[#1a1a1a] dark:text-[#f5f5f5] leading-tight tracking-tight mb-2 group-hover:opacity-70 transition-opacity text-base md:text-lg">
                {post.title}
              </h2>

              {/* Description - Optional, smaller */}
              {post.description && (
                <p
                  className="text-[#666] dark:text-[#999] leading-relaxed overflow-hidden text-xs md:text-sm"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {post.description}
                </p>
              )}
            </div>
          </article>
        </Link>
      );
    }
  }

  // Generate page numbers for pagination
  function getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Show max 7 page numbers

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 transition-colors">
      {/* Posts Sections */}
      <section className="w-full py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          {postGroups.map((group, groupIndex) => {
            const isReversed = groupIndex % 2 === 1; // Alternate layout direction
            const largePost = group[0];
            const smallPosts = group.slice(1, 5);

            return (
              <div
                key={groupIndex}
                className={`mb-16 md:mb-24 last:mb-0 ${
                  groupIndex > 0
                    ? "border-t border-[#e5e5e5] dark:border-[#262626] pt-16 md:pt-24"
                    : ""
                }`}
              >
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 ${
                    isReversed ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  {/* Large Card */}
                  {largePost && (
                    <div className={isReversed ? "lg:col-start-2" : ""}>
                      {renderPostCard(largePost, true)}
                    </div>
                  )}

                  {/* Small Cards Grid */}
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 ${
                      isReversed ? "lg:col-start-1" : ""
                    }`}
                  >
                    {smallPosts.map((post) => renderPostCard(post, false))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex justify-center items-center gap-2 py-8 px-4"
          aria-label="페이지네이션"
        >
          {/* Previous Button */}
          <Link
            to={currentPage > 1 ? `/?page=${currentPage - 1}` : "#"}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage > 1
                ? "text-[#1a1a1a] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-800"
                : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
            }`}
            aria-disabled={currentPage === 1}
          >
            이전
          </Link>

          {/* Page Numbers */}
          <div className="flex gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-4 py-2 text-gray-400 dark:text-gray-600"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <Link
                  key={pageNum}
                  to={`/?page=${pageNum}`}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#1a1a1a] dark:bg-[#f5f5f5] text-white dark:text-[#1a1a1a]"
                      : "text-[#1a1a1a] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>

          {/* Next Button */}
          <Link
            to={currentPage < totalPages ? `/?page=${currentPage + 1}` : "#"}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage < totalPages
                ? "text-[#1a1a1a] dark:text-[#f5f5f5] hover:bg-gray-100 dark:hover:bg-gray-800"
                : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
            }`}
            aria-disabled={currentPage === totalPages}
          >
            다음
          </Link>
        </nav>
      )}
    </div>
  );
}
