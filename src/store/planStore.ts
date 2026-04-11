import { create } from 'zustand';
import { plansApi } from '../api/plans';
import type { Plan, UserActivePlan, PlanFeature, PlanType, PlanChangeResult } from '../types';

interface PlanState {
  // Data
  plans: Plan[];
  userPlan: UserActivePlan | null;
  features: PlanFeature[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPlans: () => Promise<void>;
  fetchUserPlan: () => Promise<void>;
  fetchFeatures: () => Promise<void>;
  changePlan: (planName: PlanType, periodo?: 'mensal' | 'anual') => Promise<PlanChangeResult | null>;
  hasAccess: (featureKey: string) => boolean;
  getPlanLevel: () => number;
  reset: () => void;
}

const PLAN_LEVELS: Record<string, number> = { free: 0, pro: 1, premium: 2 };

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  userPlan: null,
  features: [],
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    const res = await plansApi.getAll();
    if (res.success && res.data) {
      set({ plans: res.data });
    }
  },

  fetchUserPlan: async () => {
    set({ isLoading: true, error: null });
    const res = await plansApi.getMyPlan();
    if (res.success && res.data) {
      set({ userPlan: res.data, isLoading: false });
    } else {
      // Fallback: plano free
      set({
        userPlan: {
          subscription_id: null,
          plano_id: '',
          plano_nome: 'free',
          plano_display: 'Free',
          preco: 0,
          status: 'sem_plano',
          features: [],
        },
        isLoading: false,
      });
    }
  },

  fetchFeatures: async () => {
    const res = await plansApi.getFeatures();
    if (res.success && res.data) {
      set({ features: res.data });
    }
  },

  changePlan: async (planName, periodo = 'mensal') => {
    set({ isLoading: true, error: null });
    const res = await plansApi.changePlan(planName, periodo);
    if (res.success && res.data) {
      // Recarregar plano ativo
      await get().fetchUserPlan();
      set({ isLoading: false });
      return res.data;
    } else {
      set({ error: res.error || 'Erro ao trocar plano', isLoading: false });
      return null;
    }
  },

  hasAccess: (featureKey: string) => {
    const { userPlan, features } = get();
    if (!userPlan) return true; // Se não carregou, permite (graceful)

    const userLevel = PLAN_LEVELS[userPlan.plano_nome] ?? 0;
    const feature = features.find(f => f.feature_key === featureKey);
    if (!feature) return true; // Feature não mapeada = permite

    const requiredLevel = PLAN_LEVELS[feature.plano_minimo] ?? 0;
    return userLevel >= requiredLevel;
  },

  getPlanLevel: () => {
    const { userPlan } = get();
    return PLAN_LEVELS[userPlan?.plano_nome ?? 'free'] ?? 0;
  },

  reset: () => {
    set({ plans: [], userPlan: null, features: [], isLoading: false, error: null });
  },
}));
