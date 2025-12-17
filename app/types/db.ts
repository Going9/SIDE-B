/**
 * Author interface for author profiles
 */
export interface Author {
  id: string;
  user_id: string; // User who created this author
  display_name: string;
  bio: string | null;
  profile_image_url: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
}

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
  category: string; // Category slug - can be any value from categories table
  content: string;
  cover_image: string | null;
  background_color: string | null; // Custom background color for detail page
  author_id: string | null;
  author?: Author; // Joined author data
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

/**
 * Site Settings interface
 */
export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Page interface for static pages
 */
export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  section: string; // 섹션 (예: 정보, 법적고지, editors 등)
  image_url: string | null; // 페이지 대표 이미지
  display_order: number; // 섹션 내 표시 순서
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

