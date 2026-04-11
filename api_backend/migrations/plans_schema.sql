-- ============================================
-- SISTEMA DE PLANOS (Free, Pro, Premium)
-- 7Finance - Migration
-- ============================================

-- 1. Tabela de planos disponíveis
CREATE TABLE IF NOT EXISTS public.planos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE CHECK (nome IN ('free', 'pro', 'premium')),
  nome_display TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  preco_anual DECIMAL(10,2) DEFAULT 0,
  stripe_price_id TEXT, -- Para futura integração com Stripe
  stripe_price_id_anual TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de assinaturas dos usuários
CREATE TABLE IF NOT EXISTS public.user_planos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES public.planos(id),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'trial', 'expirado', 'pendente')),
  periodo TEXT NOT NULL DEFAULT 'mensal' CHECK (periodo IN ('mensal', 'anual')),
  inicio_em TIMESTAMPTZ DEFAULT now(),
  fim_em TIMESTAMPTZ,
  trial_fim_em TIMESTAMPTZ,
  stripe_subscription_id TEXT, -- Para futura integração com Stripe
  stripe_customer_id TEXT,
  cancelado_em TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de features por plano (controle granular)
CREATE TABLE IF NOT EXISTS public.plano_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  plano_minimo TEXT NOT NULL DEFAULT 'free' CHECK (plano_minimo IN ('free', 'pro', 'premium')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Histórico de mudanças de plano
CREATE TABLE IF NOT EXISTS public.plano_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plano_anterior_id UUID REFERENCES public.planos(id),
  plano_novo_id UUID NOT NULL REFERENCES public.planos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('upgrade', 'downgrade', 'cancelamento', 'reativacao', 'trial')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_planos_user_id ON public.user_planos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_planos_status ON public.user_planos(status);
CREATE INDEX IF NOT EXISTS idx_user_planos_plano_id ON public.user_planos(plano_id);
CREATE INDEX IF NOT EXISTS idx_user_planos_active ON public.user_planos(user_id, status) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_plano_historico_user ON public.plano_historico(user_id);
CREATE INDEX IF NOT EXISTS idx_plano_features_key ON public.plano_features(feature_key);

-- ============================================
-- CONSTRAINT: Apenas 1 plano ativo por usuário
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_plan 
ON public.user_planos(user_id) WHERE status = 'ativo';

-- ============================================
-- DADOS INICIAIS: Planos
-- ============================================
INSERT INTO public.planos (nome, nome_display, descricao, preco, preco_anual, ordem, features) VALUES
(
  'free',
  'Free',
  'Comece a organizar suas finanças sem custo',
  0,
  0,
  1,
  '[
    {"key": "dashboard_basico", "label": "Dashboard básico"},
    {"key": "ganhos_despesas", "label": "Registro de ganhos e despesas"},
    {"key": "km_basico", "label": "Controle de KM básico"},
    {"key": "limite_registros", "label": "Até 50 registros/mês"}
  ]'::jsonb
),
(
  'pro',
  'Pro',
  'Para motoristas que querem crescer com inteligência',
  29.90,
  299.00,
  2,
  '[
    {"key": "dashboard_completo", "label": "Dashboard completo com gráficos"},
    {"key": "ganhos_despesas", "label": "Registro ilimitado de ganhos e despesas"},
    {"key": "km_completo", "label": "Controle de KM com relatórios"},
    {"key": "manutencao", "label": "Gestão de manutenções"},
    {"key": "insights", "label": "Insights inteligentes"},
    {"key": "metas", "label": "Metas financeiras"},
    {"key": "exportar_dados", "label": "Exportar dados (CSV/PDF)"},
    {"key": "suporte_prioritario", "label": "Suporte prioritário"}
  ]'::jsonb
),
(
  'premium',
  'Premium',
  'Controle total e recursos exclusivos para profissionais',
  59.90,
  599.00,
  3,
  '[
    {"key": "tudo_pro", "label": "Tudo do plano Pro"},
    {"key": "precificacao", "label": "Precificação inteligente"},
    {"key": "multiplos_veiculos", "label": "Múltiplos veículos"},
    {"key": "relatorios_avancados", "label": "Relatórios avançados"},
    {"key": "api_acesso", "label": "Acesso à API"},
    {"key": "chat_ilimitado", "label": "Chat ilimitado"},
    {"key": "suporte_vip", "label": "Suporte VIP 24/7"},
    {"key": "sem_anuncios", "label": "Sem anúncios"},
    {"key": "backup_automatico", "label": "Backup automático"}
  ]'::jsonb
)
ON CONFLICT (nome) DO NOTHING;

-- ============================================
-- DADOS INICIAIS: Features com plano mínimo
-- ============================================
INSERT INTO public.plano_features (feature_key, nome, descricao, plano_minimo) VALUES
('dashboard_basico',       'Dashboard Básico',           'Resumo básico de finanças',                   'free'),
('ganhos_despesas',        'Ganhos e Despesas',          'Registrar ganhos e despesas',                  'free'),
('km_basico',              'Controle de KM',             'Registro básico de quilometragem',             'free'),
('dashboard_completo',     'Dashboard Completo',         'Dashboard com gráficos e análises',            'pro'),
('km_completo',            'KM com Relatórios',          'Controle de KM com relatórios detalhados',     'pro'),
('manutencao',             'Gestão de Manutenções',      'Controle completo de manutenções',             'pro'),
('insights',               'Insights Inteligentes',      'Análises automáticas e dicas',                 'pro'),
('metas',                  'Metas Financeiras',          'Definir e acompanhar metas',                   'pro'),
('exportar_dados',         'Exportar Dados',             'Exportar relatórios em CSV/PDF',               'pro'),
('precificacao',           'Precificação Inteligente',   'Análise de custo por KM e corrida',            'premium'),
('multiplos_veiculos',     'Múltiplos Veículos',         'Gerenciar vários veículos',                    'premium'),
('relatorios_avancados',   'Relatórios Avançados',       'Relatórios detalhados e personalizados',       'premium'),
('api_acesso',             'Acesso à API',               'Integração via API',                           'premium'),
('chat_ilimitado',         'Chat Ilimitado',             'Mensagens sem limite',                         'premium'),
('sem_anuncios',           'Sem Anúncios',               'Experiência sem propagandas',                  'premium'),
('backup_automatico',      'Backup Automático',          'Backups diários automáticos',                  'premium')
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_historico ENABLE ROW LEVEL SECURITY;

-- Planos: todos podem ler
CREATE POLICY "planos_select_all" ON public.planos
  FOR SELECT USING (true);

-- Planos: apenas admin pode modificar
CREATE POLICY "planos_admin_all" ON public.planos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- User Planos: usuário vê apenas seus planos
CREATE POLICY "user_planos_select_own" ON public.user_planos
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- User Planos: admin pode ver todos
CREATE POLICY "user_planos_admin_select" ON public.user_planos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- User Planos: inserir/atualizar próprio ou admin
CREATE POLICY "user_planos_insert_own" ON public.user_planos
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "user_planos_update_own" ON public.user_planos
  FOR UPDATE USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Features: todos podem ler
CREATE POLICY "plano_features_select_all" ON public.plano_features
  FOR SELECT USING (true);

-- Histórico: usuário vê apenas seu histórico
CREATE POLICY "plano_historico_select_own" ON public.plano_historico
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "plano_historico_insert" ON public.plano_historico
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- FUNCTION: Atribuir plano Free a novos usuários
-- ============================================
CREATE OR REPLACE FUNCTION public.assign_free_plan()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM public.planos WHERE nome = 'free' LIMIT 1;
  
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_planos (user_id, plano_id, status, periodo)
    VALUES (NEW.id, free_plan_id, 'ativo', 'mensal');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: ao criar novo usuário, atribui plano Free
DROP TRIGGER IF EXISTS on_user_created_assign_plan ON public.users;
CREATE TRIGGER on_user_created_assign_plan
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_free_plan();

-- ============================================
-- FUNCTION: Trocar plano do usuário
-- ============================================
CREATE OR REPLACE FUNCTION public.change_user_plan(
  p_user_id UUID,
  p_new_plan_name TEXT,
  p_periodo TEXT DEFAULT 'mensal'
)
RETURNS JSONB AS $$
DECLARE
  v_old_plan_id UUID;
  v_new_plan_id UUID;
  v_old_plan_nome TEXT;
  v_change_type TEXT;
  v_old_ordem INT;
  v_new_ordem INT;
  v_new_subscription_id UUID;
BEGIN
  -- Buscar plano novo
  SELECT id, ordem INTO v_new_plan_id, v_new_ordem
  FROM public.planos WHERE nome = p_new_plan_name AND is_active = true;
  
  IF v_new_plan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plano não encontrado');
  END IF;
  
  -- Buscar plano atual
  SELECT up.plano_id, p.nome, p.ordem 
  INTO v_old_plan_id, v_old_plan_nome, v_old_ordem
  FROM public.user_planos up
  JOIN public.planos p ON p.id = up.plano_id
  WHERE up.user_id = p_user_id AND up.status = 'ativo'
  LIMIT 1;
  
  -- Determinar tipo de mudança
  IF v_old_plan_id IS NULL THEN
    v_change_type := 'reativacao';
  ELSIF v_new_ordem > v_old_ordem THEN
    v_change_type := 'upgrade';
  ELSIF v_new_ordem < v_old_ordem THEN
    v_change_type := 'downgrade';
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Já está neste plano');
  END IF;
  
  -- Desativar plano anterior
  UPDATE public.user_planos 
  SET status = 'cancelado', updated_at = now()
  WHERE user_id = p_user_id AND status = 'ativo';
  
  -- Criar nova assinatura
  INSERT INTO public.user_planos (user_id, plano_id, status, periodo, inicio_em)
  VALUES (p_user_id, v_new_plan_id, 'ativo', p_periodo, now())
  RETURNING id INTO v_new_subscription_id;
  
  -- Registrar histórico
  INSERT INTO public.plano_historico (user_id, plano_anterior_id, plano_novo_id, tipo)
  VALUES (p_user_id, v_old_plan_id, v_new_plan_id, v_change_type);
  
  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_new_subscription_id,
    'change_type', v_change_type,
    'old_plan', v_old_plan_nome,
    'new_plan', p_new_plan_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Buscar plano ativo do usuário
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_active_plan(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'subscription_id', up.id,
    'plano_id', p.id,
    'plano_nome', p.nome,
    'plano_display', p.nome_display,
    'preco', p.preco,
    'preco_anual', p.preco_anual,
    'status', up.status,
    'periodo', up.periodo,
    'inicio_em', up.inicio_em,
    'fim_em', up.fim_em,
    'features', p.features
  ) INTO v_result
  FROM public.user_planos up
  JOIN public.planos p ON p.id = up.plano_id
  WHERE up.user_id = p_user_id AND up.status = 'ativo'
  LIMIT 1;
  
  -- Se não tem plano ativo, retorna free como padrão
  IF v_result IS NULL THEN
    SELECT jsonb_build_object(
      'subscription_id', null,
      'plano_id', p.id,
      'plano_nome', p.nome,
      'plano_display', p.nome_display,
      'preco', p.preco,
      'status', 'sem_plano',
      'features', p.features
    ) INTO v_result
    FROM public.planos p WHERE p.nome = 'free' LIMIT 1;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
