import { data } from "react-router";
import type { Route } from "./+types/page.$slug";
import { getPageBySlug } from "../utils/pages";
import { markdownToHtml } from "../utils/markdown";

export function meta({ params, data }: Route.MetaArgs) {
  const page = data?.page;
  if (!page) {
    return [{ title: "페이지를 찾을 수 없습니다 | SIDE B" }];
  }
  return [{ title: `${page.title} | SIDE B` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const slug = params.slug;

  if (!slug) {
    throw data(null, { status: 404 });
  }

  const page = await getPageBySlug(slug);

  if (!page) {
    throw data(null, { status: 404 });
  }

  return { page };
}

export default function PageDetail({ loaderData }: Route.ComponentProps) {
  const { page } = loaderData;

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

