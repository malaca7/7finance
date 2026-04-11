import { useEffect, useState } from 'react';
import { Check, X, Crown, Sparkles, Star, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { usePlanStore } from '../store/planStore';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { PlanBadge } from '../components/plans/PlanBadge';
import type { PlanType } from '../types';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

type BillingPeriod = 'mensal' | 'anual';

const planIcons: Record<PlanType, React.ElementType> = {
  free: Star,
  pro: Sparkles,
  premium: Crown,
};

const planGradients: Record<PlanType, string> = {
  free: 'from-gray-600/10 to-gray-700/5',
  pro: 'from-blue-600/15 to-purple-600/10',
  premium: 'from-amber-500/15 to-yellow-500/10',
};

const planBorders: Record<PlanType, string> = {
  free: 'border-white/10',
  pro: 'border-blue-500/30',
  premium: 'border-amber-500/30',
};

const planButtonStyles: Record<PlanType, string> = {
  free: 'bg-premium-darkGray text-white hover:bg-premium-gray',
  pro: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-[0_0_20px_rgba(59,130,246,0.25)]',
  premium: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-400 hover:to-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
};

const planGlows: Record<PlanType, string> = {
  free: '',
  pro: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]',
  premium: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
};

// Features completo para exibição estática (complementa o banco)
const allFeatures = [
  { label: 'Dashboard básico', free: true, pro: true, premium: true },
  { label: 'Registro de ganhos e despesas', free: true, pro: true, premium: true },
  { label: 'Controle de KM básico', free: true, pro: true, premium: true },
  { label: 'Até 50 registros/mês', free: true, pro: false, premium: false },
  { label: 'Registros ilimitados', free: false, pro: true, premium: true },
  { label: 'Dashboard com gráficos', free: false, pro: true, premium: true },
  { label: 'KM com relatórios', free: false, pro: true, premium: true },
  { label: 'Gestão de manutenções', free: false, pro: true, premium: true },
  { label: 'Insights inteligentes', free: false, pro: true, premium: true },
  { label: 'Metas financeiras', free: false, pro: true, premium: true },
  { label: 'Exportar dados (CSV/PDF)', free: false, pro: true, premium: true },
  { label: 'Suporte prioritário', free: false, pro: true, premium: true },
  { label: 'Precificação inteligente', free: false, pro: false, premium: true },
  { label: 'Múltiplos veículos', free: false, pro: false, premium: true },
  { label: 'Relatórios avançados', free: false, pro: false, premium: true },
  { label: 'Chat ilimitado', free: false, pro: false, premium: true },
  { label: 'Suporte VIP 24/7', free: false, pro: false, premium: true },
  { label: 'Sem anúncios', free: false, pro: false, premium: true },
  { label: 'Backup automático', free: false, pro: false, premium: true },
];

export function PlansPage() {
  const { plans, fetchPlans, changePlan, isLoading } = usePlanStore();
  const { planName, planLevel } = usePlanAccess();
  const [billing, setBilling] = useState<BillingPeriod>('mensal');
  const [changingPlan, setChangingPlan] = useState<PlanType | null>(null);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleChangePlan = async (targetPlan: PlanType) => {
    if (targetPlan === planName) return;

    setChangingPlan(targetPlan);
    try {
      const result = await changePlan(targetPlan, billing);
      if (result) {
        const action = result.change_type === 'upgrade' ? 'Upgrade' : 
                       result.change_type === 'downgrade' ? 'Downgrade' : 'Mudança';
        toast.success(`${action} realizado com sucesso! 🎉`);
      } else {
        toast.error('Erro ao trocar de plano');
      }
    } catch {
      toast.error('Erro ao processar mudança');
    } finally {
      setChangingPlan(null);
    }
  };

  const getButtonLabel = (target: PlanType) => {
    const targetLevel = { free: 0, pro: 1, premium: 2 }[target];
    if (target === planName) return 'Plano Atual';
    if (targetLevel > planLevel) return 'Fazer Upgrade';
    return 'Trocar Plano';
  };

  const getPrice = (plan: { preco: number; preco_anual?: number }) => {
    if (billing === 'anual' && plan.preco_anual) {
      return plan.preco_anual / 12;
    }
    return plan.preco;
  };

  const displayPlans: { nome: PlanType; nome_display: string; preco: number; preco_anual: number; descricao: string }[] =
    plans.length > 0
      ? plans.map(p => ({
          nome: p.nome,
          nome_display: p.nome_display,
          preco: p.preco,
          preco_anual: p.preco_anual ?? 0,
          descricao: p.descricao ?? '',
        }))
      : [
          { nome: 'free', nome_display: 'Free', preco: 0, preco_anual: 0, descricao: 'Comece a organizar suas finanças sem custo' },
          { nome: 'pro', nome_display: 'Pro', preco: 29.90, preco_anual: 299.00, descricao: 'Para motoristas que querem crescer com inteligência' },
          { nome: 'premium', nome_display: 'Premium', preco: 59.90, preco_anual: 599.00, descricao: 'Controle total e recursos exclusivos para profissionais' },
        ];

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 pb-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-white">Escolha seu plano</h1>
          </div>
          <p className="text-neutral text-sm max-w-md mx-auto">
            Potencialize seus ganhos com as ferramentas certas. Cancele quando quiser.
          </p>

          {/* Plano atual */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-premium-darkGray border border-white/5">
            <span className="text-neutral text-xs">Seu plano:</span>
            <PlanBadge plan={planName} size="sm" />
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBilling('mensal')}
            className={clsx(
              'px-5 py-2 rounded-full text-sm font-medium transition-all duration-200',
              billing === 'mensal'
                ? 'bg-primary text-white shadow-glow-green-sm'
                : 'text-neutral hover:text-white'
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBilling('anual')}
            className={clsx(
              'px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 relative',
              billing === 'anual'
                ? 'bg-primary text-white shadow-glow-green-sm'
                : 'text-neutral hover:text-white'
            )}
          >
            Anual
            <span className="absolute -top-2 -right-12 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              -17%
            </span>
          </button>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayPlans.map((plan) => {
            const Icon = planIcons[plan.nome];
            const isCurrent = plan.nome === planName;
            const isPopular = plan.nome === 'pro';
            const price = getPrice(plan);

            return (
              <div
                key={plan.nome}
                className={clsx(
                  'relative rounded-3xl p-6 border transition-all duration-300',
                  'bg-gradient-to-b',
                  planGradients[plan.nome],
                  planBorders[plan.nome],
                  planGlows[plan.nome],
                  isCurrent && 'ring-2 ring-primary/40',
                  isPopular && 'md:scale-105 md:z-10'
                )}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      MAIS POPULAR
                    </span>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    plan.nome === 'free' && 'bg-white/5',
                    plan.nome === 'pro' && 'bg-blue-500/15',
                    plan.nome === 'premium' && 'bg-amber-500/15',
                  )}>
                    <Icon className={clsx(
                      'w-5 h-5',
                      plan.nome === 'free' && 'text-neutral',
                      plan.nome === 'pro' && 'text-blue-400',
                      plan.nome === 'premium' && 'text-amber-400',
                    )} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.nome_display}</h3>
                    {isCurrent && (
                      <span className="text-[10px] text-primary font-medium">Plano Atual</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {price === 0 ? (
                    <div className="text-3xl font-bold text-white">Grátis</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-neutral">R$</span>
                      <span className="text-3xl font-bold text-white">
                        {price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-sm text-neutral">/mês</span>
                    </div>
                  )}
                  {billing === 'anual' && plan.preco_anual > 0 && (
                    <p className="text-xs text-neutral mt-1">
                      R$ {plan.preco_anual.toFixed(2).replace('.', ',')} cobrado anualmente
                    </p>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-neutral mb-6">{plan.descricao}</p>

                {/* CTA Button */}
                <button
                  onClick={() => handleChangePlan(plan.nome)}
                  disabled={isCurrent || changingPlan !== null}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200',
                    isCurrent
                      ? 'bg-premium-darkGray text-neutral cursor-default border border-white/5'
                      : planButtonStyles[plan.nome],
                    !isCurrent && 'active:scale-[0.98]',
                    changingPlan === plan.nome && 'opacity-70'
                  )}
                >
                  {changingPlan === plan.nome ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : !isCurrent ? (
                    <ArrowRight className="w-4 h-4" />
                  ) : null}
                  {getButtonLabel(plan.nome)}
                </button>

                {/* Features */}
                <div className="mt-6 space-y-2.5">
                  {allFeatures.map((feat) => {
                    const hasAccess = feat[plan.nome];
                    return (
                      <div key={feat.label} className="flex items-start gap-2.5">
                        {hasAccess ? (
                          <Check className={clsx(
                            'w-4 h-4 mt-0.5 shrink-0',
                            plan.nome === 'free' && 'text-primary',
                            plan.nome === 'pro' && 'text-blue-400',
                            plan.nome === 'premium' && 'text-amber-400',
                          )} />
                        ) : (
                          <X className="w-4 h-4 mt-0.5 shrink-0 text-neutral/30" />
                        )}
                        <span className={clsx(
                          'text-xs leading-relaxed',
                          hasAccess ? 'text-white/80' : 'text-neutral/30'
                        )}>
                          {feat.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-neutral/50 text-xs">
            Todos os planos incluem criptografia de dados e atualizações automáticas.
            <br />
            Preparado para integração com Stripe. Cancele a qualquer momento.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
