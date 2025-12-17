-- Remove the check constraint on posts.category to allow any category value
-- This allows editors to create posts with any category slug, including newly created categories

-- First, find and drop the existing check constraint
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'posts'::regclass
      AND contype = 'c'
      AND conname LIKE '%category%';
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE posts DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No category constraint found';
    END IF;
END $$;

-- Alternative approach: Try to drop common constraint names
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS check_category;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS category_check;

-- Add comment explaining the change
COMMENT ON COLUMN posts.category IS 'Category slug. Can be any value that exists in the categories table or any valid slug string.';

