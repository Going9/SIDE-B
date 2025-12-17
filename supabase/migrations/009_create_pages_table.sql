-- Create pages table for managing static pages (about, contact, privacy, terms)
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pages with sample content
INSERT INTO pages (slug, title, content, is_active)
VALUES
  ('about', '소개', '# 소개

SIDE B는 개발자의 취향과 기록을 담는 공간입니다.

기술, 자동차, 자산, 그리고 내면에 대한 생각을 기록합니다.', true),
  ('contact', '문의', '# 문의

문의사항이 있으시면 언제든지 연락주세요.

이메일: contact@sideb.com', true),
  ('privacy', '개인정보처리방침', '# 개인정보처리방침

## 1. 개인정보의 처리 목적

SIDE B는 다음의 목적을 위하여 개인정보를 처리합니다.

- 서비스 제공 및 계약의 이행
- 회원 관리 및 본인 확인

## 2. 개인정보의 처리 및 보유기간

개인정보는 원칙적으로 개인정보의 처리목적이 달성되면 지체없이 파기합니다.', true),
  ('terms', '이용약관', '# 이용약관

## 제1조 (목적)

이 약관은 SIDE B가 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

## 제2조 (정의)

1. "서비스"란 SIDE B가 제공하는 모든 서비스를 의미합니다.
2. "이용자"란 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 의미합니다.', true)
ON CONFLICT (slug) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_is_active ON pages(is_active);

-- Enable Row Level Security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access for active pages
CREATE POLICY "Allow public read access for active pages" ON pages
  FOR SELECT
  USING (is_active = true);

-- Policy: Only authenticated users can manage pages
CREATE POLICY "Authenticated users can manage pages" ON pages
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_pages_updated_at_trigger
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_pages_updated_at();

