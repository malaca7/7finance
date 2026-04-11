import type { PlanType } from '../types';

/**
 * Mapa centralizado: rota → plano mínimo necessário.
 * Rotas ausentes = acesso livre (free).
 */
export const ROUTE_PLAN_MAP: Record<string, PlanType> = {
  // Free — acesso básico
  '/dashboard':     'free',
  '/perfil':        'free',
  '/planos':        'free',
  '/ganhos':        'free',
  '/despesas':      'free',

  // Pro — funcionalidades intermediárias
  '/km':            'pro',
  '/manutencao':    'pro',
  '/notifications': 'pro',
  '/chat':          'pro',

  // Premium — acesso total
  // (hoje todas as features existentes estão cobertas por Free/Pro)
  // Quando adicionar rotas exclusivas Premium, mapear aqui
};

const PLAN_LEVELS: Record<string, number> = { free: 0, pro: 1, premium: 2 };

/**
 * Retorna o plano mínimo para uma rota.
 * Rotas não mapeadas retornam 'free'.
 */
export function getRouteMinPlan(path: string): PlanType {
  return ROUTE_PLAN_MAP[path] ?? 'free';
}

/**
 * Verifica se um nível de plano tem acesso a uma rota.
 */
export function canAccessRoute(userPlan: PlanType, path: string): boolean {
  const required = getRouteMinPlan(path);
  return (PLAN_LEVELS[userPlan] ?? 0) >= (PLAN_LEVELS[required] ?? 0);
}
