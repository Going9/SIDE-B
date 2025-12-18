import { Link, useNavigate } from "react-router";
import { memo } from "react";
import type { Post } from "../types/db";
import type { Category } from "../utils/categories";
import { formatDateKST } from "../utils/date";
import { handleImageError } from "../utils/image";
import AuthorProfile from "./author-profile";
import { createAuthorSlug } from "../utils/slug";

interface PostCardProps {
  post: Post;
  category: Category | null;
  isLarge?: boolean;
}

function PostCard({ post, category, isLarge = false }: PostCardProps) {
  const navigate = useNavigate();
  const categoryLabel = category?.label || post.category;

  function handleAuthorClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const authorSlug = post.author?.slug || createAuthorSlug(post.author?.display_name || "");
    navigate(`/${authorSlug}`);
  }

  if (isLarge) {
    // Large card: text overlay on image with gradient
    return (
      <Link
        to={`/article/${post.slug}`}
        className="block h-full group"
        aria-label={`${post.title} 읽기`}
      >
        <article className="relative h-full overflow-hidden transition-all duration-300 hover:opacity-95 group/article">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent transition-opacity duration-300 group-hover/article:from-black/80 group-hover/article:via-black/50" />

              {/* Text Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 lg:p-10">
                <div className="flex items-end justify-between gap-6 md:gap-8">
                  {/* Left: Text Content */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Category */}
                    <span className="px-0.75 text-xs font-medium text-white/90 uppercase tracking-wider mb-2 md:mb-3">
                      {categoryLabel}
                    </span>

                    {/* Title */}
                    <h2 className="font-semibold text-white leading-tight tracking-tight mb-2 md:mb-3 text-2xl md:text-3xl lg:text-4xl">
                      {post.title}
                    </h2>

                    {/* Description */}
                    {post.description && (
                      <p className="px-0.5 text-white/90 leading-relaxed text-sm md:text-base lg:text-lg line-clamp-3 mb-2 md:mb-3">
                        {post.description}
                      </p>
                    )}

                    {/* Date */}
                    <time
                      dateTime={post.created_at}
                      className="px-1 text-xs text-white/70 mt-auto"
                    >
                      {formatDateKST(post.created_at)}
                    </time>
                  </div>

                  {/* Right: Author Profile */}
                  {post.author && (
                    <div
                      onClick={handleAuthorClick}
                      className="flex flex-col items-center gap-2 flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex-shrink-0 ring-2 ring-white/20">
                        {post.author.profile_image_url ? (
                          <img
                            src={post.author.profile_image_url}
                            alt={post.author.display_name}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/30">
                            <span className="text-white text-sm font-medium">
                              {post.author.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-white/90 font-medium text-center max-w-[80px] truncate">
                        {post.author.display_name}
                      </span>
                    </div>
                  )}
                </div>
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
      <article className="h-full overflow-hidden transition-all duration-300 flex flex-col group/article hover:shadow-lg dark:hover:shadow-gray-900/20">
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
            {/* Category overlay - bottom left */}
            <div className="absolute bottom-0 left-0 p-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {categoryLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative w-full bg-gray-200 dark:bg-gray-700 aspect-[3/4]">
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <span className="text-xs uppercase tracking-wider font-mono">
                {categoryLabel}
              </span>
            </div>
            {/* Category overlay - bottom left */}
            <div className="absolute bottom-0 left-0 p-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {categoryLabel}
              </span>
            </div>
          </div>
        )}

        {/* Content - Smaller proportion */}
        <div className="px-3 py-3 flex-1 flex flex-col">
          <div className="flex items-end justify-between gap-3">
            {/* Left: Text Content */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Title */}
              <h2 className="font-semibold text-[#1a1a1a] dark:text-[#f5f5f5] leading-tight tracking-tight mb-2 group-hover:opacity-70 transition-opacity text-base md:text-lg">
                {post.title}
              </h2>

              {/* Description */}
              {post.description && (
                <p className="text-[#666] dark:text-[#999] leading-relaxed overflow-hidden text-xs md:text-sm line-clamp-2 mb-2">
                  {post.description}
                </p>
              )}

              {/* Date */}
              <time
                dateTime={post.created_at}
                className="text-xs text-[#999] dark:text-[#666] mt-auto"
              >
                {formatDateKST(post.created_at)}
              </time>
            </div>

            {/* Right: Author Profile */}
            {post.author && (
              <div
                onClick={handleAuthorClick}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
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
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export default memo(PostCard);
