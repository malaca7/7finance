import { supabase } from './supabase';
import type { Plan, UserActivePlan, PlanFeature, PlanChangeResult, PlanType, ApiResponse } from '../types';

const apiResponse = <T>(data: T | null, error: any): ApiResponse<T> => {
  if (error) {
    console.error('Plans API Error:', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
  return { success: true, data: data as T };
};

// Cache do users.id
let _cachedUserId: string | null = null;
async function getMyUserId(): Promise<string | null> {
  if (_cachedUserId) return _cachedUserId;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
  _cachedUserId = data?.id || null;
  return _cachedUserId;
}
supabase.auth.onAuthStateChange(() => { _cachedUserId = null; });

export const plansApi = {
  // Buscar todos os planos disponíveis
  async getAll(): Promise<ApiResponse<Plan[]>> {
    const { data, error } = await supabase
      .from('planos')
      .select('*')
      .eq('is_active', true)
      .order('ordem', { ascending: true });
    
    return apiResponse(data, error);
  },

  // Buscar plano ativo do usuário logado
  async getMyPlan(): Promise<ApiResponse<UserActivePlan>> {
    const userId = await getMyUserId();
    if (!userId) return { success: false, error: 'Usuário não autenticado' };

    const { data, error } = await supabase.rpc('get_user_active_plan', {
      p_user_id: userId,
    });

    if (error) return { success: false, error: error.message || 'Erro ao buscar plano' };
    return { success: true, data: data as UserActivePlan };
  },

  // Trocar plano do usuário
  async changePlan(planName: PlanType, periodo: 'mensal' | 'anual' = 'mensal'): Promise<ApiResponse<PlanChangeResult>> {
    const userId = await getMyUserId();
    if (!userId) return { success: false, error: 'Usuário não autenticado' };

    const { data, error } = await supabase.rpc('change_user_plan', {
      p_user_id: userId,
      p_new_plan_name: planName,
      p_periodo: periodo,
    });

    if (error) return { success: false, error: error.message || 'Erro ao trocar plano' };
    
    const result = data as PlanChangeResult;
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result };
  },

  // Buscar features com plano mínimo
  async getFeatures(): Promise<ApiResponse<PlanFeature[]>> {
    const { data, error } = await supabase
      .from('plano_features')
      .select('*')
      .order('plano_minimo', { ascending: true });

    return apiResponse(data, error);
  },

  // Verificar se o usuário tem acesso a uma feature
  async hasFeatureAccess(featureKey: string): Promise<boolean> {
    const userId = await getMyUserId();
    if (!userId) return false;

    // Buscar plano ativo
    const { data: planData } = await supabase.rpc('get_user_active_plan', {
      p_user_id: userId,
    });

    if (!planData) return false;

    const userPlan = planData as UserActivePlan;
    const planHierarchy: Record<string, number> = { free: 0, pro: 1, premium: 2 };
    const userLevel = planHierarchy[userPlan.plano_nome] ?? 0;

    // Buscar plano mínimo da feature
    const { data: featureData } = await supabase
      .from('plano_features')
      .select('plano_minimo')
      .eq('feature_key', featureKey)
      .single();

    if (!featureData) return true; // Se feature não existe no controle, permite
    const requiredLevel = planHierarchy[featureData.plano_minimo] ?? 0;

    return userLevel >= requiredLevel;
  },

  // Buscar histórico de planos
  async getHistory(): Promise<ApiResponse<any[]>> {
    const userId = await getMyUserId();
    if (!userId) return { success: false, error: 'Usuário não autenticado' };

    const { data, error } = await supabase
      .from('plano_historico')
      .select(`
        *,
        plano_anterior:plano_anterior_id(nome, nome_display),
        plano_novo:plano_novo_id(nome, nome_display)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return apiResponse(data, error);
  },
};
