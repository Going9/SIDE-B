-- Add section and image fields to pages table
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS section TEXT DEFAULT '정보',
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing pages with appropriate sections
UPDATE pages SET section = '정보' WHERE slug IN ('about', 'contact');
UPDATE pages SET section = '법적고지' WHERE slug IN ('privacy', 'terms');

-- Create index for section
CREATE INDEX IF NOT EXISTS idx_pages_section ON pages(section);

-- Add comment
COMMENT ON COLUMN pages.section IS '페이지가 속한 섹션 (예: 정보, 법적고지, editors 등). Footer에서 그룹화에 사용됩니다.';
COMMENT ON COLUMN pages.image_url IS '페이지 대표 이미지 URL';
COMMENT ON COLUMN pages.display_order IS '섹션 내에서의 표시 순서';

