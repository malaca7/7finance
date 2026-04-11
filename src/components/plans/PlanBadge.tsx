import { clsx } from 'clsx';
import { Crown, Sparkles, Star } from 'lucide-react';
import type { PlanType } from '../../types';

interface PlanBadgeProps {
  plan: PlanType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const planConfig: Record<PlanType, {
  label: string;
  icon: React.ElementType;
  colors: string;
  glow: string;
}> = {
  free: {
    label: 'Free',
    icon: Star,
    colors: 'bg-premium-darkGray text-neutral border-white/10',
    glow: '',
  },
  pro: {
    label: 'Pro',
    icon: Sparkles,
    colors: 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border-blue-500/30',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.25)]',
  },
  premium: {
    label: 'Premium',
    icon: Crown,
    colors: 'bg-gradient-to-r from-amber-600/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
  },
};

export function PlanBadge({ plan, size = 'md', showIcon = true, className }: PlanBadgeProps) {
  const config = planConfig[plan] || planConfig.free;
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-semibold border rounded-full',
        'transition-all duration-200',
        config.colors,
        config.glow,
        {
          'px-2 py-0.5 text-[10px]': size === 'sm',
          'px-3 py-1 text-xs': size === 'md',
          'px-4 py-1.5 text-sm': size === 'lg',
        },
        className
      )}
    >
      {showIcon && (
        <Icon className={clsx({
          'w-3 h-3': size === 'sm',
          'w-3.5 h-3.5': size === 'md',
          'w-4 h-4': size === 'lg',
        })} />
      )}
      {config.label}
    </span>
  );
}
