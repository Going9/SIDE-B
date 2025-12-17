import { Link } from "react-router";
import { data } from "react-router";
import type { Route } from "./+types/$category";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import type { Post } from "../types/db";
import { getPostsByCategory } from "../utils/supabase";
import { getCategoryBySlug, isValidCategory } from "../utils/categories";
import { formatDateKSTFull } from "../utils/date";

interface LoaderData {
  category: {
    href: string;
    label: string;
    description: string;
    category: string;
  };
  posts: Post[];
}

export function meta({ params, data }: Route.MetaArgs) {
  // Use loaderData if available (preferred)
  if (data?.category) {
    return [
      { title: `${data.category.label} | SIDE B` },
      {
        name: "description",
        content: data.category.description || "카테고리 페이지",
      },
    ];
  }

  // Fallback: return default meta if loaderData not available
  const categorySlug = params.category || "";
  return [
    { title: categorySlug ? `${categorySlug} | SIDE B` : "카테고리 | SIDE B" },
    {
      name: "description",
      content: "카테고리 페이지",
    },
  ];
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<LoaderData> {
  const categorySlug = params.category;

  // Validate category parameter
  const isValid = await isValidCategory(categorySlug);
  if (!isValid) {
    throw data(null, { status: 404 });
  }

  const category = await getCategoryBySlug(categorySlug);
  if (!category) {
    throw data(null, { status: 404 });
  }

  // Fetch posts from Supabase for this category
  const posts = await getPostsByCategory(category.slug as Post["category"]);

  return {
    category: {
      href: `/${category.slug}`,
      label: category.label,
      description: category.description,
      category: category.slug,
    },
    posts,
  };
}

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const { category, posts } = loaderData;

  return (
    <div className="w-full">
      {/* Category Header */}
      <section className="w-full py-16 md:py-24 px-6 bg-white dark:bg-gray-900 transition-colors">
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
      <section className="w-full py-16 px-6 bg-[#f8f9fa] dark:bg-gray-800 transition-colors">
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
                <Link key={post.id} to={`/article/${post.slug}`}>
                  <Card className="h-full hover:opacity-90 transition-opacity">
                    {/* Cover Image */}
                    {post.cover_image && post.cover_image.trim() !== "" ? (
                      <div className="relative aspect-[16/9] bg-gray-200 dark:bg-gray-700 w-full overflow-hidden">
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-[16/9] bg-gray-200 dark:bg-gray-700 w-full">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                          <span className="text-xs uppercase tracking-wider font-mono">
                            {category.label}
                          </span>
                        </div>
                      </div>
                    )}

                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {category.label}
                        </span>
                        <time
                          dateTime={post.created_at}
                          className="text-xs font-mono text-gray-400 dark:text-gray-500"
                        >
                          {formatDateKSTFull(post.created_at)}
                        </time>
                      </div>
                      <CardTitle className="text-2xl mb-3 text-[#111111] dark:text-gray-100">
                        {post.title}
                      </CardTitle>
                      {post.subtitle && (
                        <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                          {post.subtitle}
                        </CardDescription>
                      )}
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
