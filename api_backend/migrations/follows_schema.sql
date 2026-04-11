-- =============================================
-- Migration: Sistema de Follows (Seguir Usuários)
-- Data: 2026-04-11
-- =============================================

-- Tabela follows
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  criada_em TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Impedir seguir a si mesmo
  CONSTRAINT follows_no_self_follow CHECK (follower_id <> following_id),
  -- Impedir duplicidade
  CONSTRAINT follows_unique_pair UNIQUE (follower_id, following_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_criada_em ON public.follows(criada_em DESC);

-- RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies: qualquer autenticado pode ver follows
CREATE POLICY "follows_select_all" ON public.follows
  FOR SELECT TO authenticated
  USING (true);

-- Apenas o próprio usuário pode criar follow (follower_id = meu user id)
CREATE POLICY "follows_insert_own" ON public.follows
  FOR INSERT TO authenticated
  WITH CHECK (
    follower_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Apenas o próprio usuário pode deletar follow que criou
CREATE POLICY "follows_delete_own" ON public.follows
  FOR DELETE TO authenticated
  USING (
    follower_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- =============================================
-- RPC: Contadores de seguidores/seguindo
-- =============================================
CREATE OR REPLACE FUNCTION public.get_follow_counts(target_user_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT json_build_object(
    'followers_count', (SELECT COUNT(*) FROM public.follows WHERE following_id = target_user_id),
    'following_count', (SELECT COUNT(*) FROM public.follows WHERE follower_id = target_user_id)
  );
$$;

-- =============================================
-- RPC: Sugestões de usuários para seguir
-- =============================================
CREATE OR REPLACE FUNCTION public.get_follow_suggestions(my_user_id UUID, lim INT DEFAULT 10)
RETURNS SETOF public.users
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT u.*
  FROM public.users u
  WHERE u.id <> my_user_id
    AND u.is_active = true
    AND u.id NOT IN (
      SELECT f.following_id FROM public.follows f WHERE f.follower_id = my_user_id
    )
  ORDER BY (
    SELECT COUNT(*) FROM public.follows WHERE following_id = u.id
  ) DESC
  LIMIT lim;
$$;
