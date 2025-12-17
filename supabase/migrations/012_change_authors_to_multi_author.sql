-- Change authors table to allow multiple authors per user
-- Step 1: Add user_id column to track who created the author
ALTER TABLE authors
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Migrate existing data: set user_id = id (since id was previously the user id)
UPDATE authors
SET user_id = id
WHERE user_id IS NULL;

-- Step 3: Create new table structure
-- We need to recreate the table because we can't change PRIMARY KEY directly
-- First, create a new table with the correct structure
CREATE TABLE IF NOT EXISTS authors_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Copy existing data to new table
INSERT INTO authors_new (id, user_id, display_name, bio, profile_image_url, slug, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,  -- Generate new UUIDs
  COALESCE(user_id, id) as user_id,  -- Use user_id if exists, otherwise use old id
  display_name,
  bio,
  profile_image_url,
  COALESCE(slug, display_name) as slug,  -- Use slug if exists, otherwise use display_name
  created_at,
  updated_at
FROM authors;

-- Step 5: Drop old table and rename new table
DROP TABLE IF EXISTS authors CASCADE;
ALTER TABLE authors_new RENAME TO authors;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_authors_display_name ON authors(display_name);
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_user_id ON authors(user_id);

-- Step 7: Recreate RLS policies
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read authors
CREATE POLICY "Public can read authors" ON authors
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create authors
CREATE POLICY "Authenticated users can create authors" ON authors
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update authors they created
CREATE POLICY "Users can update own authors" ON authors
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete authors they created
CREATE POLICY "Users can delete own authors" ON authors
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 8: Recreate trigger
CREATE OR REPLACE FUNCTION update_authors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_authors_updated_at_trigger
  BEFORE UPDATE ON authors
  FOR EACH ROW
  EXECUTE FUNCTION update_authors_updated_at();

-- Step 9: Update posts table foreign key to reference authors(id) instead of auth.users(id)
-- First, drop the old foreign key constraint
ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

-- Add new foreign key constraint referencing authors(id)
ALTER TABLE posts
ADD CONSTRAINT posts_author_id_fkey
FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL;

