-- Tabela hackaton: formulário Hackathon de IA
-- Execute este script no SQL Editor do Supabase (Dashboard > SQL Editor).
--
-- Antes de executar as políticas de Storage (final do arquivo), crie o bucket:
-- Storage > New bucket > Nome: hackaton-insights, Public: off

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS public.hackaton (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_empresa text NOT NULL,
  site_empresa text,
  insights_file_path text,
  numero_insight text NOT NULL,
  quadrante_insight text NOT NULL,
  descricao_insight text NOT NULL,
  book_operacionalizacao text NOT NULL,
  concluido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas por user_id e concluido
CREATE INDEX IF NOT EXISTS idx_hackaton_user_id ON public.hackaton(user_id);
CREATE INDEX IF NOT EXISTS idx_hackaton_concluido ON public.hackaton(concluido);
CREATE INDEX IF NOT EXISTS idx_hackaton_created_at ON public.hackaton(created_at DESC);

-- 2. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_hackaton_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hackaton_updated_at ON public.hackaton;
CREATE TRIGGER hackaton_updated_at
  BEFORE UPDATE ON public.hackaton
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_hackaton_updated_at();

-- 3. Habilitar RLS
ALTER TABLE public.hackaton ENABLE ROW LEVEL SECURITY;

-- Política SELECT: usuário vê os próprios; super_admin vê todos
CREATE POLICY "hackaton_select_own"
  ON public.hackaton FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- Política INSERT: apenas com user_id = auth.uid()
CREATE POLICY "hackaton_insert_own"
  ON public.hackaton FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política UPDATE: dono ou super_admin
CREATE POLICY "hackaton_update_own_or_admin"
  ON public.hackaton FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- Política DELETE: dono ou super_admin
CREATE POLICY "hackaton_delete_own_or_admin"
  ON public.hackaton FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- 4. Storage bucket para anexos de insights
-- O bucket pode ser criado pela interface do Supabase (Storage > New bucket) com nome: hackaton-insights
-- Ou via API. Políticas abaixo assumem que o bucket já existe.

-- Política: usuário autenticado pode fazer upload apenas no próprio path (user_id/...)
CREATE POLICY "hackaton_insights_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hackaton-insights'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: usuário pode ler apenas os próprios arquivos
CREATE POLICY "hackaton_insights_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'hackaton-insights'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: super_admin pode ler todos os arquivos do bucket
CREATE POLICY "hackaton_insights_admin_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'hackaton-insights'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- Política: usuário pode deletar apenas os próprios arquivos
CREATE POLICY "hackaton_insights_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'hackaton-insights'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
