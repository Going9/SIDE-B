import { createClient } from "@supabase/supabase-js";
import type { Post } from "../types/db";
import { logError } from "./error-handler";

// 1. 환경 변수에서 키 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. 키가 없으면 에러 발생 (디버깅용)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables! Check your .env file."
  );
}

// 3. 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch the latest posts from Supabase with pagination
 */
export async function getLatestPosts(
  limit: number = 4,
  offset: number = 0
): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logError(error, { component: "supabase", action: "getLatestPosts" });
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }

  return (data || []) as Post[];
}

/**
 * Get total count of posts
 */
export async function getTotalPostsCount(): Promise<number> {
  const { count, error } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  if (error) {
    logError(error, { component: "supabase", action: "getTotalPostsCount" });
    throw new Error(`Failed to fetch posts count: ${error.message}`);
  }

  return count || 0;
}

export async function getPostsByCategory(
  category: Post["category"]
): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    logError(error, {
      component: "supabase",
      action: "getPostsByCategory",
      metadata: { category },
    });
    throw new Error(`Failed to fetch posts by category: ${error.message}`);
  }

  return (data || []) as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    logError(error, {
      component: "supabase",
      action: "getPostBySlug",
      metadata: { slug },
    });
    throw new Error(`Failed to fetch post: ${error.message}`);
  }

  return data as Post;
}
