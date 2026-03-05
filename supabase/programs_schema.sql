-- ============================================
-- Programação da Rádio - Rádio Centro
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  host TEXT,
  description TEXT,
  -- Dias da semana em que o programa vai ao ar (0=Dom,1=Seg,...,6=Sáb)
  weekdays INTEGER[] NOT NULL,
  -- Horário local da rádio
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notify_on_start BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Leitura pública para o app móvel (anon key)
CREATE POLICY "programs_select_public"
  ON programs FOR SELECT
  USING (true);

