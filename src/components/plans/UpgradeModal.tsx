import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Lock, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlanBadge } from './PlanBadge';
import type { PlanType } from '../../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  requiredPlan?: PlanType;
}

const planLabels: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
};

export function UpgradeModal({ isOpen, onClose, featureName, requiredPlan = 'pro' }: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/planos');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform rounded-3xl bg-premium-dark p-6 shadow-card transition-all border border-white/10 text-center">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-neutral hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Lock Icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
                  <Lock className="w-7 h-7 text-amber-400" />
                </div>

                {/* Title */}
                <Dialog.Title className="text-xl font-bold text-white mb-2">
                  Recurso Exclusivo
                </Dialog.Title>

                {/* Description */}
                <p className="text-neutral text-sm mb-4">
                  {featureName ? (
                    <>
                      <span className="text-white font-medium">{featureName}</span> está disponível a partir do plano{' '}
                      <PlanBadge plan={requiredPlan} size="sm" />
                    </>
                  ) : (
                    <>
                      Este recurso requer o plano <PlanBadge plan={requiredPlan} size="sm" />
                    </>
                  )}
                </p>

                <p className="text-neutral/70 text-xs mb-6">
                  Faça upgrade para desbloquear todas as funcionalidades e turbinar seus resultados.
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleUpgrade}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-200 active:scale-[0.98]"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                    Ver Planos
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full px-6 py-3 rounded-2xl font-medium text-neutral hover:text-white hover:bg-premium-darkGray transition-all duration-200"
                  >
                    Agora não
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
