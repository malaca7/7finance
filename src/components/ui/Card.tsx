import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'warning';
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-premium-dark/90 backdrop-blur-md rounded-2xl p-6 shadow-[0_2px_24px_0_rgba(0,0,0,0.20)]',
        'border border-premium-gray/40',
        {
          'border-primary/80 shadow-[0_0_32px_0_rgba(111,76,255,0.25)]': variant === 'highlight',
          'border-red-500/50': variant === 'warning',
        },
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
