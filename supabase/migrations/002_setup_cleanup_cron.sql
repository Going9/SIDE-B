-- Schedule cleanup job to run daily at 3 AM UTC
-- This job will call the cleanup_temp_images Edge Function
-- Note: pg_cron jobs in Supabase may require special setup
-- Alternative: Use Supabase Scheduled Functions or external cron service

-- Option 1: Using pg_cron (if available in your Supabase plan)
-- Uncomment and adjust the schedule as needed
/*
SELECT cron.schedule(
  'cleanup-temp-images',
  '0 3 * * *', -- Daily at 3 AM UTC (cron format)
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-temp-images',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object()
  );
  $$
);
*/

-- Option 2: Manual cleanup function (can be called directly)
-- This function can be called by the Edge Function or manually
CREATE OR REPLACE FUNCTION cleanup_temp_images_older_than_24h()
RETURNS TABLE(deleted_count INTEGER, deleted_paths TEXT[]) AS $$
DECLARE
  deleted_count INTEGER := 0;
  deleted_paths TEXT[] := ARRAY[]::TEXT[];
  image_record RECORD;
BEGIN
  -- Find all temp images older than 24 hours
  FOR image_record IN
    SELECT id, storage_path
    FROM images
    WHERE status = 'temp'
      AND created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Mark as deleted in database
    UPDATE images
    SET status = 'deleted'
    WHERE id = image_record.id;
    
    deleted_count := deleted_count + 1;
    deleted_paths := array_append(deleted_paths, image_record.storage_path);
  END LOOP;
  
  RETURN QUERY SELECT deleted_count, deleted_paths;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (Edge Function will use service role)
GRANT EXECUTE ON FUNCTION cleanup_temp_images_older_than_24h() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_temp_images_older_than_24h() TO service_role;

