-- ============================================
-- Banners de publicidade - Rádio Centro
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS ads_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  target_url TEXT,
  position TEXT NOT NULL DEFAULT 'home_radio',
  kind TEXT NOT NULL DEFAULT 'image', -- 'image' | 'adsense'
  html_snippet TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ads_banners ENABLE ROW LEVEL SECURITY;

-- Leitura pública para o app móvel
CREATE POLICY "ads_banners_select_public"
  ON ads_banners FOR SELECT
  USING (true);

