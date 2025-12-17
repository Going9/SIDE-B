// Supabase Edge Function: Cleanup Temporary Images
// This function deletes images with status 'temp' that are older than 24 hours

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = new Date().toISOString();
  console.log(`[${startTime}] Cleanup function started`);

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[ERROR] Missing Supabase environment variables");
      throw new Error("Missing Supabase environment variables");
    }

    console.log(`[INFO] Supabase URL: ${supabaseUrl}`);
    console.log(`[INFO] Service key present: ${supabaseServiceKey ? "Yes" : "No"}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse query parameters for testing (optional: ?hours=1 for 1 hour, default 24)
    // hours=0 means delete all temp images regardless of age
    const url = new URL(req.url);
    const hoursParam = url.searchParams.get("hours");
    const hours = hoursParam ? parseInt(hoursParam, 10) : 24;
    const hoursInMs = hours * 60 * 60 * 1000;

    console.log(`[INFO] Cleanup threshold: ${hours} hours`);

    // Build query - if hours is 0, don't filter by time
    let query = supabase
      .from("images")
      .select("id, storage_path, created_at")
      .eq("status", "temp");

    // Only add time filter if hours > 0
    if (hours > 0) {
      query = query.lt("created_at", new Date(Date.now() - hoursInMs).toISOString());
    }

    const { data: tempImages, error: fetchError } = await query;

    if (fetchError) {
      console.error(`[ERROR] Failed to fetch temp images: ${fetchError.message}`);
      throw new Error(`Failed to fetch temp images: ${fetchError.message}`);
    }

    console.log(`[INFO] Found ${tempImages?.length || 0} temp images to check`);

    if (!tempImages || tempImages.length === 0) {
      const endTime = new Date().toISOString();
      console.log(`[${endTime}] Cleanup completed: No temp images to clean up`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `No temp images older than ${hours} hours to clean up`,
          deletedCount: 0,
          hoursThreshold: hours,
          executedAt: startTime,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`[INFO] Processing ${tempImages.length} temp images for deletion`);

    const deletedPaths: string[] = [];
    const errors: string[] = [];

    // Delete each image from storage and database
    for (const image of tempImages) {
      try {
        // Extract bucket and path from storage_path
        // Format: "content/filename.jpg" or "public/filename.jpg"
        const pathParts = image.storage_path.split("/");
        if (pathParts.length < 2) {
          errors.push(`Invalid storage path: ${image.storage_path}`);
          continue;
        }

        const fileName = pathParts.slice(1).join("/"); // Handle nested paths

        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
          .from("images")
          .remove([image.storage_path]);

        if (storageError) {
          errors.push(
            `Failed to delete ${image.storage_path} from storage: ${storageError.message}`
          );
          // Continue to mark as deleted in DB even if storage deletion fails
        }

        // Mark as deleted in database
        const { error: dbError } = await supabase
          .from("images")
          .update({ status: "deleted" })
          .eq("id", image.id);

        if (dbError) {
          errors.push(
            `Failed to update ${image.id} in database: ${dbError.message}`
          );
        } else {
          deletedPaths.push(image.storage_path);
        }
      } catch (err) {
        errors.push(
          `Error processing ${image.storage_path}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    const endTime = new Date().toISOString();
    console.log(`[${endTime}] Cleanup completed: ${deletedPaths.length} images deleted, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed: ${deletedPaths.length} images deleted`,
        deletedCount: deletedPaths.length,
        totalFound: tempImages.length,
        hoursThreshold: hours,
        executedAt: startTime,
        completedAt: endTime,
        deletedPaths,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorTime = new Date().toISOString();
    console.error(`[${errorTime}] [ERROR] Cleanup error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

