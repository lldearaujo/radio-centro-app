-- ============================================
-- Notificações - Rádio Centro
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- Dispositivos registrados para push
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expo_push_token TEXT NOT NULL UNIQUE,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- App (anon key) pode inserir/atualizar tokens
CREATE POLICY "push_tokens_insert_public"
  ON push_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "push_tokens_update_public"
  ON push_tokens FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- Log de notificações enviadas via painel admin
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_ok BOOLEAN,
  error TEXT
);

ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Apenas service_role (painel admin) pode ler/gravar
CREATE POLICY "notifications_log_service_role"
  ON notifications_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

