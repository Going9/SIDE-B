import { data } from "react-router";
import type { Route } from "./+types/$slug";
import { getPageBySlug } from "../utils/pages";
import { getCategoryBySlug, isValidCategory } from "../utils/categories";
import { getPostsByAuthor } from "../utils/supabase";
import { getPostsByCategory } from "../utils/supabase";
import { getAuthorByDisplayName } from "../utils/authors";
import { decodeAuthorSlug } from "../utils/slug";
import { markdownToHtml } from "../utils/markdown";
import type { Post } from "../types/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Link } from "react-router";
import { formatDateKSTFull } from "../utils/date";
import { handleImageError } from "../utils/image";
import PostCard from "../components/post-card";
import { getCategoriesBySlugs } from "../utils/categories";
import type { Category } from "../utils/categories";

interface LoaderData {
  type: "page" | "category" | "author";
  page?: {
    id: string;
    slug: string;
    title: string;
    content: string;
    image_url: string | null;
  };
  category?: {
    href: string;
    label: string;
    description: string;
    category: string;
  };
  author?: {
    id: string;
    display_name: string;
    bio: string | null;
    profile_image_url: string | null;
  };
  posts?: Post[];
  categories?: Record<string, Category | null>;
}

export function meta({ params, data }: Route.MetaArgs) {
  const slug = params.slug || "";
  
  if (data?.type === "page" && data.page) {
    return [{ title: `${data.page.title} | SIDE B` }];
  }
  
  if (data?.type === "category" && data.category) {
    return [
      { title: `${data.category.label} | SIDE B` },
      {
        name: "description",
        content: data.category.description || "카테고리 페이지",
      },
    ];
  }
  
  if (data?.type === "author" && data.author) {
    return [{ title: `${data.author.display_name} | SIDE B` }];
  }
  
  return [{ title: `${slug} | SIDE B` }];
}

export async function loader({ params }: Route.LoaderArgs): Promise<LoaderData> {
  const slug = params.slug;

  if (!slug) {
    throw data(null, { status: 404 });
  }

  // First, check if this is a page
  const page = await getPageBySlug(slug);
  if (page) {
    return {
      type: "page",
      page: {
        id: page.id,
        slug: page.slug,
        title: page.title,
        content: page.content,
        image_url: page.image_url,
      },
    };
  }

  // Second, check if this is an author (by display name)
  const decodedName = decodeAuthorSlug(slug);
  const author = await getAuthorByDisplayName(decodedName);
  if (author) {
    // Fetch posts by this author
    const posts = await getPostsByAuthor(author.id);
    
    // Load categories for all posts
    const categorySlugs = [...new Set(posts.map((post) => post.category))];
    const categories = await getCategoriesBySlugs(categorySlugs);
    
    return {
      type: "author",
      author: {
        id: author.id,
        display_name: author.display_name,
        bio: author.bio,
        profile_image_url: author.profile_image_url,
      },
      posts,
      categories,
    };
  }

  // Third, check if it's a category
  const isValid = await isValidCategory(slug);
  if (!isValid) {
    throw data(null, { status: 404 });
  }

  const category = await getCategoryBySlug(slug);
  if (!category) {
    throw data(null, { status: 404 });
  }

  // Fetch posts from Supabase for this category
  const posts = await getPostsByCategory(category.slug);

  return {
    type: "category",
    category: {
      href: `/${category.slug}`,
      label: category.label,
      description: category.description,
      category: category.slug,
    },
    posts,
  };
}

export default function SlugPage({ loaderData }: Route.ComponentProps) {
  const { type, page, category, author, posts, categories } = loaderData;

  // Render page if it's a page
  if (type === "page" && page) {
    return (
      <div className="w-full min-h-screen bg-[#faf9f6] dark:bg-gray-950 transition-colors">
        <div className="container mx-auto max-w-3xl px-6 py-16 md:py-24">
          {page.image_url && (
            <div className="mb-8">
              <img
                src={page.image_url}
                alt={page.title}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold text-[#111111] dark:text-gray-100 mb-8 tracking-tight">
            {page.title}
          </h1>
          <div
            className="prose prose-lg prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-[#111111] dark:prose-headings:text-gray-100 prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6 prose-ul:my-6 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:leading-relaxed prose-code:text-[#2563eb] dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-strong:text-[#111111] dark:prose-strong:text-gray-100 prose-strong:font-semibold"
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(page.content),
            }}
          />
        </div>
      </div>
    );
  }

  // Render author if it's an author
  if (type === "author" && author && posts !== undefined && categories) {
    return (
      <div className="w-full min-h-screen bg-[#faf9f6] dark:bg-[#1a1a1a] transition-colors">
        {/* Profile Section */}
        <section className="w-full py-16 md:py-24 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col items-center text-center">
              {/* Profile Image - Larger, centered */}
              <div className="mb-8">
                {author.profile_image_url ? (
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-300 dark:ring-gray-600 mx-auto">
                    <img
                      src={author.profile_image_url}
                      alt={author.display_name}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-gray-300 dark:ring-gray-600 mx-auto">
                    <span className="text-5xl md:text-6xl font-bold text-gray-600 dark:text-gray-400">
                      {author.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <h1 className="text-4xl md:text-5xl font-bold text-[#111111] dark:text-gray-100 mb-6 tracking-tight">
                {author.display_name}
              </h1>

              {/* Bio */}
              {author.bio && (
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                  {author.bio}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        {posts.length > 0 && (
          <section className="w-full py-8 px-6">
            <div className="container mx-auto max-w-7xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    category={categories[post.category]}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {posts.length === 0 && (
          <section className="w-full py-16 px-6">
            <div className="container mx-auto max-w-4xl text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                아직 작성한 글이 없습니다.
              </p>
            </div>
          </section>
        )}
      </div>
    );
  }

  // Render category if it's a category
  if (type === "category" && category && posts) {
    return (
      <div className="w-full">
        {/* Category Header */}
        <section className="w-full py-16 md:py-24 px-6 bg-[#faf9f6] dark:bg-[#1a1a1a] transition-colors">
          <div className="container mx-auto max-w-5xl">
            <h1 className="text-5xl md:text-6xl font-bold text-[#111111] dark:text-gray-100 tracking-tight mb-6">
              {category.label}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
              {category.description}
            </p>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="w-full py-16 px-6 bg-[#faf9f6] dark:bg-[#1a1a1a] transition-colors">
          <div className="container mx-auto max-w-7xl">
            {posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  이 카테고리에 게시글이 없습니다.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Link key={post.id} to={`/article/${post.slug}`} className="block h-full group">
                    <Card className="h-full overflow-hidden transition-all duration-300 flex flex-col group/article hover:shadow-lg dark:hover:shadow-gray-900/20 bg-[#faf9f6] dark:bg-[#1a1a1a] shadow-sm border border-gray-200/50 dark:border-gray-800/50 dark:shadow-gray-900/30 dark:hover:shadow-gray-900/50">
                      {/* Cover Image */}
                      {post.cover_image && post.cover_image.trim() !== "" ? (
                        <div className="relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[3/4]">
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                            onError={handleImageError}
                          />
                          {/* Category overlay - bottom left */}
                          <div className="absolute bottom-0 left-0 p-3">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {category.label}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full bg-gray-200 dark:bg-gray-700 aspect-[3/4]">
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <span className="text-xs uppercase tracking-wider font-mono">
                              {category.label}
                            </span>
                          </div>
                          {/* Category overlay - bottom left */}
                          <div className="absolute bottom-0 left-0 p-3">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              {category.label}
                            </span>
                          </div>
                        </div>
                      )}

                      <CardContent className="px-3 py-3 flex-1 flex flex-col">
                        <div className="flex items-end justify-between gap-3">
                          {/* Left: Text Content */}
                          <div className="flex-1 flex flex-col min-w-0">
                            {/* Title */}
                            <h2 className="font-semibold text-[#1a1a1a] dark:text-[#f5f5f5] leading-tight tracking-tight mb-2 group-hover:opacity-70 transition-opacity text-base md:text-lg">
                              {post.title}
                            </h2>

                            {/* Description */}
                            {post.subtitle && (
                              <p className="text-[#666] dark:text-[#999] leading-relaxed overflow-hidden text-xs md:text-sm line-clamp-2 mb-2">
                                {post.subtitle}
                              </p>
                            )}

                            {/* Date */}
                            <time
                              dateTime={post.created_at}
                              className="text-xs text-[#999] dark:text-[#666] mt-auto"
                            >
                              {formatDateKSTFull(post.created_at)}
                            </time>
                          </div>

                          {/* Right: Author Profile */}
                          {post.author && (
                            <Link
                              to={`/${encodeURIComponent(post.author.display_name)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex flex-col items-center gap-1.5 flex-shrink-0 hover:opacity-70 transition-opacity"
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 ring-1 ring-gray-300 dark:ring-gray-600">
                                {post.author.profile_image_url ? (
                                  <img
                                    src={post.author.profile_image_url}
                                    alt={post.author.display_name}
                                    className="w-full h-full object-cover"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
                                    <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                      {post.author.display_name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-[#666] dark:text-[#999] font-medium text-center max-w-[60px] truncate">
                                {post.author.display_name}
                              </span>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Should not reach here, but just in case
  throw data(null, { status: 404 });
}

