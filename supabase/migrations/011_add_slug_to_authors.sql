-- Add slug column to authors table
ALTER TABLE authors
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update existing authors with slug based on display_name
-- For now, use display_name as-is (application will handle URL encoding)
-- This matches the createAuthorSlug function behavior
UPDATE authors
SET slug = display_name
WHERE slug IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);

-- Handle duplicate slugs before adding UNIQUE constraint
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Check if there are any duplicate slugs
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT slug, COUNT(*) as cnt
    FROM authors
    WHERE slug IS NOT NULL
    GROUP BY slug
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    -- Handle duplicates by appending a number
    WITH numbered AS (
      SELECT 
        id,
        slug,
        ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
      FROM authors
      WHERE slug IS NOT NULL
    )
    UPDATE authors a
    SET slug = CASE 
      WHEN n.rn > 1 THEN n.slug || '-' || n.rn::text
      ELSE n.slug
    END
    FROM numbered n
    WHERE a.id = n.id;
  END IF;
END $$;

-- Add UNIQUE constraint (after handling duplicates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'authors_slug_unique'
  ) THEN
    ALTER TABLE authors
    ADD CONSTRAINT authors_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- Make slug NOT NULL after populating
-- Use a default value for any remaining NULLs
UPDATE authors
SET slug = COALESCE(slug, 'author-' || id::text)
WHERE slug IS NULL;

ALTER TABLE authors
ALTER COLUMN slug SET NOT NULL;

