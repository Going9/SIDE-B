/**
 * Image utility functions
 */

/**
 * Generate image srcset for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [400, 800, 1200, 1600]
): string {
  return widths
    .map((width) => `${baseUrl}?w=${width} ${width}w`)
    .join(", ");
}

/**
 * Get optimized image URL with Supabase transformations
 */
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "jpeg" | "png";
  }
): string {
  if (!url || !url.includes("supabase.co")) {
    return url;
  }

  const params = new URLSearchParams();
  if (options?.width) params.set("width", String(options.width));
  if (options?.height) params.set("height", String(options.height));
  if (options?.quality) params.set("quality", String(options.quality));
  if (options?.format) params.set("format", options.format);

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${params.toString()}`;
}

/**
 * Handle image load error
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>
): void {
  const target = event.target as HTMLImageElement;
  target.style.display = "none";
  
  const parent = target.parentElement;
  if (parent && !parent.querySelector(".image-placeholder")) {
    const placeholder = document.createElement("div");
    placeholder.className =
      "image-placeholder absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700";
    placeholder.innerHTML = `
      <span class="text-xs uppercase tracking-wider font-mono text-gray-400 dark:text-gray-500">
        이미지를 불러올 수 없습니다
      </span>
    `;
    parent.appendChild(placeholder);
  }
}

