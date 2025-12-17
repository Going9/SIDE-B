-- Add author_id column to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for author_id
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);

-- Note: Existing posts will have author_id as NULL
-- You may want to set a default author for existing posts:
-- UPDATE posts SET author_id = (SELECT id FROM auth.users LIMIT 1) WHERE author_id IS NULL;

