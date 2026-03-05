-- ============================================
-- Schema de Enquetes - Rádio Centro
-- Execute este arquivo no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/cktzysdqfohqhtpprxdf/sql
-- ============================================

-- Tipo para status da enquete
CREATE TYPE poll_status AS ENUM ('draft', 'active', 'closed');

-- Tabela de enquetes
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status poll_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  highlight BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS polls_status_idx ON polls (status);
CREATE INDEX IF NOT EXISTS polls_highlight_idx ON polls (highlight);
CREATE INDEX IF NOT EXISTS polls_created_at_idx ON polls (created_at DESC);

-- Tabela de opções de voto
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS poll_options_poll_id_idx ON poll_options (poll_id);

-- Tabela de votos (1 voto por enquete por voter_id)
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options (id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS poll_votes_unique_voter_per_poll
  ON poll_votes (poll_id, voter_id);

CREATE INDEX IF NOT EXISTS poll_votes_poll_id_idx ON poll_votes (poll_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Políticas: leitura pública para enquetes e opções
CREATE POLICY "polls_select_public"
  ON polls FOR SELECT
  USING (true);

CREATE POLICY "poll_options_select_public"
  ON poll_options FOR SELECT
  USING (true);

-- Políticas: qualquer um pode inserir e ler votos (app usa anon key)
-- INSERT só é permitido enquanto a enquete estiver ativa e dentro do período.
CREATE POLICY "poll_votes_insert_public"
  ON poll_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM polls
      WHERE polls.id = poll_id
        AND status = 'active'
        AND (starts_at IS NULL OR now() >= starts_at)
        AND (ends_at IS NULL OR now() <= ends_at)
    )
  );

CREATE POLICY "poll_votes_select_public"
  ON poll_votes FOR SELECT
  USING (true);

-- ============================================
-- Trigger para updated_at em polls (opcional)
-- ============================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS polls_updated_at ON polls;
CREATE TRIGGER polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();
