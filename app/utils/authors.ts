import { supabase } from "./supabase";
import type { Author } from "../types/db";
import { logError } from "./error-handler";

/**
 * Get author by ID
 */
export async function getAuthorById(id: string): Promise<Author | null> {
  const { data, error } = await supabase
    .from("authors")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    logError(error, { component: "authors", action: "getAuthorById", metadata: { id } });
    return null;
  }

  return (data as Author) || null;
}

/**
 * Get all authors
 */
export async function getAllAuthors(): Promise<Author[]> {
  const { data, error } = await supabase
    .from("authors")
    .select("*")
    .order("display_name", { ascending: true });

  if (error) {
    logError(error, { component: "authors", action: "getAllAuthors" });
    return [];
  }

  return (data || []) as Author[];
}

/**
 * Get authors by IDs (batch query)
 */
export async function getAuthorsByIds(ids: string[]): Promise<Record<string, Author | null>> {
  if (ids.length === 0) return {};

  const { data, error } = await supabase
    .from("authors")
    .select("*")
    .in("id", ids);

  if (error) {
    logError(error, { component: "authors", action: "getAuthorsByIds" });
    // Fallback: try individual queries
    const result: Record<string, Author | null> = {};
    await Promise.all(
      ids.map(async (id) => {
        result[id] = await getAuthorById(id);
      })
    );
    return result;
  }

  // Convert array to record
  const result: Record<string, Author | null> = {};
  ids.forEach((id) => {
    result[id] = (data || []).find((author) => author.id === id) || null;
  });

  return result;
}

/**
 * Get author by display name (for slug-based routing)
 */
export async function getAuthorByDisplayName(displayName: string): Promise<Author | null> {
  const { data, error } = await supabase
    .from("authors")
    .select("*")
    .eq("display_name", displayName)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    logError(error, { component: "authors", action: "getAuthorByDisplayName", metadata: { displayName } });
    return null;
  }

  return (data as Author) || null;
}

