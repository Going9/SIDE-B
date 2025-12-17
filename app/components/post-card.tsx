import { Link } from "react-router";
import { memo } from "react";
import type { Post } from "../types/db";
import type { Category } from "../utils/categories";
import { formatDateKST } from "../utils/date";
import { handleImageError } from "../utils/image";

interface PostCardProps {
  post: Post;
  category: Category | null;
  isLarge?: boolean;
}

function PostCard({ post, category, isLarge = false }: PostCardProps) {
  const categoryLabel = category?.label || post.category;

  if (isLarge) {
    // Large card: text overlay on image with gradient
    return (
      <Link
        to={`/article/${post.slug}`}
        className="block h-full group"
        aria-label={`${post.title} 읽기`}
      >
        <article className="relative h-full overflow-hidden transition-all duration-300 hover:opacity-95">
          {/* Cover Image */}
          {post.cover_image && post.cover_image.trim() !== "" ? (
            <div className="relative w-full h-full aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
                decoding="async"
                onError={handleImageError}
              />
              {/* Gradient overlay - always visible */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

              {/* Text Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 lg:p-10">
                {/* Category and Date */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-white/90 uppercase tracking-wider">
                    {categoryLabel}
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
                  <p className="text-white/90 leading-relaxed text-base md:text-lg line-clamp-3">
                    {post.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full aspect-[4/5] bg-gray-200 dark:bg-gray-700">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <span className="text-xs uppercase tracking-wider font-mono">
                  {categoryLabel}
                </span>
              </div>
            </div>
          )}
        </article>
      </Link>
    );
  }

  // Small card: larger image, smaller text
  return (
    <Link
      to={`/article/${post.slug}`}
      className="block h-full group"
      aria-label={`${post.title} 읽기`}
    >
      <article className="h-full overflow-hidden transition-all duration-300 flex flex-col">
        {/* Cover Image - Larger proportion */}
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
          </div>
        ) : (
          <div className="relative w-full bg-gray-200 dark:bg-gray-700 aspect-[3/4]">
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <span className="text-xs uppercase tracking-wider font-mono">
                {categoryLabel}
              </span>
            </div>
          </div>
        )}

        {/* Content - Smaller proportion */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Category and Date */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#666] dark:text-[#999] uppercase tracking-wider">
              {categoryLabel}
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
            <p className="text-[#666] dark:text-[#999] leading-relaxed overflow-hidden text-xs md:text-sm line-clamp-2">
              {post.description}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

export default memo(PostCard);

