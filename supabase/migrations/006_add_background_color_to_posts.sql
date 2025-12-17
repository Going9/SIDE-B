-- Add background_color column to posts table
-- This allows editors to set a custom background color for the article detail page
-- or use automatic color extraction from the cover image

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS background_color TEXT;

-- Add comment
COMMENT ON COLUMN posts.background_color IS 'Custom background color for article detail page (hex color code, e.g., #faf9f6). If null, will use default or auto-extracted color.';

