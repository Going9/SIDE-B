import { supabase } from "./supabase";
import { logError } from "./error-handler";
import type { SiteSetting } from "../types/db";

/**
 * Get site setting by key
 */
export async function getSiteSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    logError(error, { component: "site-settings", action: "getSiteSetting", metadata: { key } });
    return null;
  }

  return data?.value || null;
}

/**
 * Get all site settings
 */
export async function getAllSiteSettings(): Promise<SiteSetting[]> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    logError(error, { component: "site-settings", action: "getAllSiteSettings" });
    return [];
  }

  return (data || []) as SiteSetting[];
}

/**
 * Update site setting
 */
export async function updateSiteSetting(
  key: string,
  value: string
): Promise<boolean> {
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      }
    );

  if (error) {
    logError(error, { component: "site-settings", action: "updateSiteSetting", metadata: { key } });
    return false;
  }

  return true;
}

