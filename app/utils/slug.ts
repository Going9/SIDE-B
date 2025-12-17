/**
 * Convert display name to URL-friendly slug
 * For Korean names, we'll use the name as-is (URL encoded)
 */
export function createAuthorSlug(displayName: string): string {
  // Remove leading/trailing spaces and encode for URL
  return encodeURIComponent(displayName.trim());
}

/**
 * Decode author slug back to display name
 */
export function decodeAuthorSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch (e) {
    return slug; // Return as-is if decoding fails
  }
}

