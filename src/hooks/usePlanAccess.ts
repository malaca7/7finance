import { useCallback } from 'react';
import { usePlanStore } from '../store/planStore';
import type { PlanType } from '../types';

const PLAN_LEVELS: Record<string, number> = { free: 0, pro: 1, premium: 2 };

/**
 * Hook para controle de acesso por plano.
 * Retorna funções para verificar permissões e o plano atual.
 */
export function usePlanAccess() {
  const { userPlan, features, hasAccess, getPlanLevel } = usePlanStore();

  const planName = userPlan?.plano_nome ?? 'free';
  const planDisplay = userPlan?.plano_display ?? 'Free';
  const planLevel = getPlanLevel();

  // Verifica se tem acesso a uma feature por key
  const canAccess = useCallback((featureKey: string): boolean => {
    return hasAccess(featureKey);
  }, [hasAccess]);

  // Verifica se o plano do usuário é >= ao plano requerido
  const requiresPlan = useCallback((minPlan: PlanType): boolean => {
    const userLevel = PLAN_LEVELS[planName] ?? 0;
    const requiredLevel = PLAN_LEVELS[minPlan] ?? 0;
    return userLevel >= requiredLevel;
  }, [planName]);

  // Retorna o plano mínimo para acessar uma feature
  const getRequiredPlan = useCallback((featureKey: string): PlanType => {
    const feature = features.find(f => f.feature_key === featureKey);
    return (feature?.plano_minimo ?? 'free') as PlanType;
  }, [features]);

  // Verifica se é plano pago
  const isPaid = planLevel > 0;
  const isPro = planLevel >= 1;
  const isPremium = planLevel >= 2;

  return {
    planName,
    planDisplay,
    planLevel,
    isPaid,
    isPro,
    isPremium,
    canAccess,
    requiresPlan,
    getRequiredPlan,
    userPlan,
  };
}
