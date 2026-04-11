-- Adicionar coluna marca à tabela veiculos
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS marca TEXT;
