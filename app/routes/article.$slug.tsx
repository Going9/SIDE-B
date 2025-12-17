import { Link } from "react-router";
import { data } from "react-router";
import type { Route } from "./+types/article.$slug";
import { getCategoryBySlug, type Category } from "../utils/categories";
import { Button } from "../components/ui/button";
import type { Post } from "../types/db";
import { getPostBySlug } from "../utils/supabase";
import { markdownToHtml } from "../utils/markdown";
import { formatDateKSTFull } from "../utils/date";
import { handleImageError } from "../utils/image";

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


  return (
    <article className="w-full">
      {/* Article Header */}
      <header className="w-full py-16 md:py-24 px-6 bg-white dark:bg-gray-900 transition-colors">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            {category && (
              <Link
                to={`/${category.slug}`}
                className="inline-block px-4 py-2 rounded-full bg-[#2563eb] dark:bg-blue-600 text-white text-sm font-medium hover:bg-[#1d4ed8] dark:hover:bg-blue-700 transition-colors mb-4"
              >
                {category.label}
              </Link>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-[#111111] dark:text-gray-100 tracking-tight leading-tight mb-6">
            {article.title}
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            {article.subtitle}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <time dateTime={article.created_at}>
              {formatDateKSTFull(article.created_at)}
            </time>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {article.cover_image && (
        <div className="w-full mb-12">
          <div className="container mx-auto max-w-6xl px-6">
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full h-auto rounded-none object-cover aspect-[16/9]"
              loading="eager"
              decoding="async"
              onError={handleImageError}
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="w-full pb-16 px-6 bg-white dark:bg-gray-900 transition-colors">
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
      <footer className="w-full py-12 px-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            {category && (
              <Button variant="outline" asChild>
                <Link to={`/${category.slug}`} className="no-underline">
                  {category.label}로 돌아가기
                </Link>
              </Button>
            )}
            <Button variant="ghost" asChild>
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
