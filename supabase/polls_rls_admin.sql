-- ============================================
-- Políticas RLS para o PAINEL ADMIN (criar/editar enquetes)
-- Execute no SQL Editor do Supabase se o cadastro de enquete retornar
-- "new row violates row-level security policy for table polls"
-- ============================================

-- Permite INSERT/UPDATE/DELETE em polls quando usando a chave service_role (painel admin)
CREATE POLICY "polls_insert_service_role"
  ON polls FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "polls_update_service_role"
  ON polls FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "polls_delete_service_role"
  ON polls FOR DELETE
  TO service_role
  USING (true);

-- Permite INSERT/UPDATE/DELETE em poll_options quando usando service_role (painel admin)
CREATE POLICY "poll_options_insert_service_role"
  ON poll_options FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "poll_options_update_service_role"
  ON poll_options FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "poll_options_delete_service_role"
  ON poll_options FOR DELETE
  TO service_role
  USING (true);
