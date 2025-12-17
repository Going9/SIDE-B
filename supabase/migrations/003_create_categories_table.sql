-- Create categories table for dynamic category management
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (slug, label, description, display_order, is_active)
VALUES
  ('mobility', '모빌리티', '움직임, 여행, 그리고 장소와 경험을 연결하는 이동수단에 대한 탐구.', 1, true),
  ('system', '시스템', '우리의 디지털 삶을 움직이는 시스템을 구축하고, 최적화하며 이해하기.', 2, true),
  ('asset', '자산', '부와 투자, 그리고 장기적 가치를 구축하는 철학에 대한 생각.', 3, true),
  ('inner-side', '내면', '철학, 디자인 원칙, 그리고 우리의 사고를 형성하는 핵심 아이디어에 대한 깊은 성찰.', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access for active categories
CREATE POLICY "Allow public read access for active categories" ON categories
  FOR SELECT
  USING (is_active = true);

-- Policy: Only authenticated users can manage categories
CREATE POLICY "Authenticated users can manage categories" ON categories
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at_trigger
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

