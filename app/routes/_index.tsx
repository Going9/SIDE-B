import { Link } from "react-router";
import { useMemo } from "react";
import type { Route } from "./+types/_index";
import type { Post } from "../types/db";
import { getCategoriesBySlugs, type Category } from "../utils/categories";
import { getLatestPosts, getTotalPostsCount } from "../utils/supabase";
import PostCard from "../components/post-card";
import { logError } from "../utils/error-handler";
import { getSiteSetting } from "../utils/site-settings";

interface LoaderData {
  posts: Post[];
  categories: Record<string, Category | null>;
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  siteDescription: string;
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

export async function loader({
  request,
}: Route.LoaderArgs): Promise<LoaderData> {
  try {
    // Get page from URL query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const currentPage = Math.max(1, page);

    // Fetch site description and posts in parallel
    const [siteDescription, totalPosts] = await Promise.all([
      getSiteSetting("site_description"),
      getTotalPostsCount(),
    ]);

    if (totalPosts === 0) {
      throw new Error(
        "No posts found in database. Please add posts to your Supabase 'posts' table."
      );
    }

    // Calculate posts to fetch
    // First page: 15 posts (3 sections)
    // Other pages: 5 posts (1 section)
    const limit = currentPage === 1 ? 15 : 5;
    const offset =
      currentPage === 1 ? 0 : 15 + (currentPage - 2) * 5;

    // Fetch posts
    const posts = await getLatestPosts(limit, offset);

    // Calculate total pages
    const remainingPosts = Math.max(0, totalPosts - 15);
    const additionalPages = Math.ceil(remainingPosts / 5);
    const totalPages = remainingPosts > 0 ? 1 + additionalPages : 1;

    // Load categories for all posts (batch query for better performance)
    const categorySlugs = [...new Set(posts.map((post) => post.category))];
    const categories = await getCategoriesBySlugs(categorySlugs);

    return {
      posts,
      categories,
      currentPage,
      totalPages,
      totalPosts,
      siteDescription: siteDescription || "개발자의 취향과 기록",
    };
  } catch (error) {
    logError(error, {
      component: "Index",
      action: "loadPosts",
      metadata: { requestUrl: request.url },
    });

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
  const { posts, categories, currentPage, totalPages } = loaderData;

  // Memoize post groups to avoid recalculation on re-renders
  const postGroups = useMemo(() => {
    const groups: Post[][] = [];
    for (let i = 0; i < posts.length; i += 5) {
      groups.push(posts.slice(i, i + 5));
    }
    return groups;
  }, [posts]);

  // Memoize page numbers calculation
  const pageNumbers = useMemo((): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="w-full bg-[#faf9f6] dark:bg-gray-950 transition-colors">
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
                      <PostCard
                        post={largePost}
                        category={categories[largePost.category]}
                        isLarge
                      />
                    </div>
                  )}

                  {/* Small Cards Grid */}
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 ${
                      isReversed ? "lg:col-start-1" : ""
                    }`}
                  >
                    {smallPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        category={categories[post.category]}
                      />
                    ))}
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
            {pageNumbers.map((page, index) => {
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
