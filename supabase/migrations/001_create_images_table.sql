-- Enable pg_cron extension (requires superuser privileges)
-- Note: This must be run by a database superuser
-- In Supabase, you may need to enable this via the dashboard or contact support
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create images table for tracking uploaded images
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('temp', 'active', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_status_created_at ON images(status, created_at);

-- Composite index for cleanup query optimization
CREATE INDEX IF NOT EXISTS idx_images_temp_cleanup ON images(status, created_at) 
  WHERE status = 'temp';

-- Enable Row Level Security
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own images
CREATE POLICY "Users can insert their own images" ON images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own images
CREATE POLICY "Users can update their own images" ON images
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can read their own images
CREATE POLICY "Users can read their own images" ON images
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all images (for cleanup function)
-- Note: This policy allows the service role to delete temp images
-- The Edge Function will use service role credentials

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_images_updated_at_trigger
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_images_updated_at();

