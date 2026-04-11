import { useState } from 'react';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { UpgradeModal } from './UpgradeModal';
import type { PlanType } from '../../types';

interface FeatureGateProps {
  feature?: string;
  minPlan?: PlanType;
  featureLabel?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente wrapper que bloqueia acesso a features baseado no plano.
 * Mostra modal de upgrade quando o usuário tenta acessar sem permissão.
 */
export function FeatureGate({ feature, minPlan, featureLabel, children, fallback }: FeatureGateProps) {
  const { canAccess, requiresPlan, getRequiredPlan } = usePlanAccess();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Verificar acesso por feature key ou por plano mínimo
  let hasPermission = true;
  let requiredPlan: PlanType = 'pro';

  if (feature) {
    hasPermission = canAccess(feature);
    requiredPlan = getRequiredPlan(feature);
  } else if (minPlan) {
    hasPermission = requiresPlan(minPlan);
    requiredPlan = minPlan;
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div
        onClick={() => setShowUpgrade(true)}
        className="cursor-pointer relative"
      >
        <div className="opacity-40 pointer-events-none select-none blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-premium-dark/90 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <span className="text-amber-400 text-sm font-medium">🔒 Requer plano {requiredPlan === 'pro' ? 'Pro' : 'Premium'}</span>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        featureName={featureLabel || feature}
        requiredPlan={requiredPlan}
      />
    </>
  );
}
