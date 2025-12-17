import { supabase } from "./supabase";
import { logError } from "./error-handler";
import type { Page } from "../types/db";

/**
 * Get page by slug
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      console.log(`Page not found: ${slug}`);
      return null; // Not found
    }
    console.error(`Error fetching page ${slug}:`, error);
    logError(error, { component: "pages", action: "getPageBySlug", metadata: { slug } });
    return null;
  }

  console.log(`Page found: ${slug}`, data);
  return (data as Page) || null;
}

/**
 * Get all pages (for admin)
 */
export async function getAllPages(): Promise<Page[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .order("section", { ascending: true })
    .order("display_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error) {
    logError(error, { component: "pages", action: "getAllPages" });
    return [];
  }

  return (data || []) as Page[];
}

/**
 * Get active pages grouped by section (for footer)
 */
export async function getActivePagesBySection(): Promise<Record<string, Page[]>> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("is_active", true)
    .order("section", { ascending: true })
    .order("display_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error) {
    logError(error, { component: "pages", action: "getActivePagesBySection" });
    return {};
  }

  // Group pages by section
  const grouped: Record<string, Page[]> = {};
  (data || []).forEach((page) => {
    const section = page.section || "정보";
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push(page as Page);
  });

  return grouped;
}

/**
 * Create or update page
 */
export async function upsertPage(
  slug: string,
  title: string,
  content: string,
  section: string = "정보",
  imageUrl: string | null = null,
  displayOrder: number = 0,
  isActive: boolean = true
): Promise<Page | null> {
  const { data, error } = await supabase
    .from("pages")
    .upsert(
      {
        slug,
        title,
        content,
        section,
        image_url: imageUrl,
        display_order: displayOrder,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "slug",
      }
    )
    .select()
    .single();

  if (error) {
    logError(error, { component: "pages", action: "upsertPage", metadata: { slug } });
    return null;
  }

  return (data as Page) || null;
}

