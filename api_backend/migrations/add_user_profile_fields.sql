-- ============================================
-- ADD bio, username, userlink columns to public.users
-- 7Finance - Migration
-- ============================================

-- Adicionar coluna bio (texto livre)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Adicionar coluna username (nome de exibição, livre)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;

-- Adicionar coluna userlink (link único do perfil público)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS userlink TEXT;

-- Userlink deve ser único (quando preenchido)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_userlink 
  ON public.users(userlink) WHERE userlink IS NOT NULL;

-- Índice para buscar por userlink (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_users_userlink_lower 
  ON public.users(LOWER(userlink));
