import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { useTheme } from '../ThemeContext';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'warning';
}

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div
      className={clsx(
        // Fundo degradê escuro ou claro
        isDark
          ? 'bg-gradient-to-br from-black via-premium-darkGray to-premium-dark/90 text-white'
          : 'bg-gradient-to-br from-white via-gray-100 to-gray-200 text-black',
        'backdrop-blur-md rounded-2xl p-6 shadow-[0_2px_24px_0_rgba(0,0,0,0.20)]',
        'border',
        isDark ? 'border-premium-gray/40' : 'border-gray-200',
        {
          'border-primary/80 shadow-[0_0_32px_0_rgba(57,255,20,0.25)]': variant === 'highlight',
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
