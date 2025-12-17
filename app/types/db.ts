/**
 * Unified Post interface matching Supabase schema
 * Used across all routes (home, category, article detail)
 */
export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle: string; // For detail view header
  description: string; // For list view summary
  category: "mobility" | "system" | "asset" | "inner-side";
  content: string;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Image interface for tracking uploaded images
 * Used for periodic cleanup of unused images
 */
export interface Image {
  id: string;
  user_id: string;
  storage_path: string;
  public_url: string;
  status: "temp" | "active" | "deleted";
  created_at: string;
  updated_at: string;
}

