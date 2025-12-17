import { supabase } from "./supabase";
import { logError } from "./error-handler";

export interface Category {
  id: string;
  slug: string;
  label: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

/**
 * Fetch active categories from database
 */
export async function getActiveCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    logError(error, { component: "categories", action: "getActiveCategories" });
    // Fallback to default categories if DB query fails
    return getDefaultCategories();
  }

  return (data || []) as Category[];
}

/**
 * Get default categories (fallback when DB is not available)
 */
export function getDefaultCategories(): Category[] {
  return [
    {
      id: "mobility",
      slug: "mobility",
      label: "모빌리티",
      description: "움직임, 여행, 그리고 장소와 경험을 연결하는 이동수단에 대한 탐구.",
      display_order: 1,
      is_active: true,
    },
    {
      id: "system",
      slug: "system",
      label: "시스템",
      description: "우리의 디지털 삶을 움직이는 시스템을 구축하고, 최적화하며 이해하기.",
      display_order: 2,
      is_active: true,
    },
    {
      id: "asset",
      slug: "asset",
      label: "자산",
      description: "부와 투자, 그리고 장기적 가치를 구축하는 철학에 대한 생각.",
      display_order: 3,
      is_active: true,
    },
    {
      id: "inner-side",
      slug: "inner-side",
      label: "내면",
      description:
        "철학, 디자인 원칙, 그리고 우리의 사고를 형성하는 핵심 아이디어에 대한 깊은 성찰.",
      display_order: 4,
      is_active: true,
    },
  ];
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    // Fallback to default categories
    const defaultCategories = getDefaultCategories();
    return defaultCategories.find((cat) => cat.slug === slug) || null;
  }

  return (data as Category) || null;
}

/**
 * Get multiple categories by slugs (batch query for better performance)
 */
export async function getCategoriesBySlugs(
  slugs: string[]
): Promise<Record<string, Category | null>> {
  if (slugs.length === 0) return {};

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .in("slug", slugs)
    .eq("is_active", true);

  if (error) {
    logError(error, { component: "categories", action: "getCategoriesBySlugs" });
    // Fallback: try individual queries
    const result: Record<string, Category | null> = {};
    await Promise.all(
      slugs.map(async (slug) => {
        result[slug] = await getCategoryBySlug(slug);
      })
    );
    return result;
  }

  // Convert array to record
  const result: Record<string, Category | null> = {};
  slugs.forEach((slug) => {
    result[slug] = (data || []).find((cat) => cat.slug === slug) || null;
  });

  return result;
}

/**
 * Check if category slug is valid
 */
export async function isValidCategory(slug: string): Promise<boolean> {
  const category = await getCategoryBySlug(slug);
  return category !== null;
}
