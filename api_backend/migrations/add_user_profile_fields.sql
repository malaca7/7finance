-- ============================================
-- ADD bio, username columns to public.users
-- 7Finance - Migration
-- ============================================

-- Adicionar coluna bio (texto livre)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Adicionar coluna username (único, para URL de perfil público)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;

-- Username deve ser único (quando preenchido)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username 
  ON public.users(username) WHERE username IS NOT NULL;

-- Índice para buscar por username
CREATE INDEX IF NOT EXISTS idx_users_username_lower 
  ON public.users(LOWER(username));
