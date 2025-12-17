import { memo } from "react";
import type { Author } from "../types/db";
import { formatDateKST } from "../utils/date";
import { handleImageError } from "../utils/image";

interface AuthorProfileProps {
  author: Author | null;
  date: string;
  size?: "sm" | "md" | "lg";
  showBio?: boolean;
  className?: string;
}

function AuthorProfile({
  author,
  date,
  size = "md",
  showBio = false,
  className = "",
}: AuthorProfileProps) {
  if (!author) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400 text-xs">?</span>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            작성자 없음
          </div>
          <time className="text-xs text-gray-500 dark:text-gray-500">
            {formatDateKST(date)}
          </time>
        </div>
      </div>
    );
  }

  const sizeClasses = {
    sm: {
      image: "w-8 h-8",
      name: "text-xs",
      date: "text-xs",
    },
    md: {
      image: "w-10 h-10",
      name: "text-sm",
      date: "text-xs",
    },
    lg: {
      image: "w-12 h-12",
      name: "text-base",
      date: "text-sm",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Profile Image */}
      <div className={`${classes.image} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0`}>
        {author.profile_image_url ? (
          <img
            src={author.profile_image_url}
            alt={author.display_name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
              {author.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Author Info */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-[#111111] dark:text-gray-100 ${classes.name}`}>
          {author.display_name}
        </div>
        <time
          dateTime={date}
          className={`text-gray-500 dark:text-gray-400 ${classes.date}`}
        >
          {formatDateKST(date)}
        </time>
        {showBio && author.bio && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {author.bio}
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(AuthorProfile);

