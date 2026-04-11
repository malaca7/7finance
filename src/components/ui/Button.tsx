import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { useTheme } from '../ThemeContext';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center font-bold transition-all duration-200 rounded-full',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Tema escuro: fundo verde neon, texto branco
            'bg-primary text-white hover:bg-accent hover:shadow-[0_0_32px_0_rgba(57,255,20,0.25)]': variant === 'primary' && isDark,
            'bg-premium-gray text-white hover:bg-premium-darkGray': variant === 'secondary' && isDark,
            'border-2 border-primary text-primary hover:bg-primary hover:text-white': variant === 'outline' && isDark,
            // Tema claro: fundo verde neon, texto preto
            'bg-primary text-black hover:bg-accent hover:shadow-[0_0_32px_0_rgba(57,255,20,0.25)]': variant === 'primary' && !isDark,
            'bg-white text-primary hover:bg-gray-100': variant === 'secondary' && !isDark,
            'border-2 border-primary text-primary hover:bg-primary hover:text-white': variant === 'outline' && !isDark,
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
            'px-4 py-2 text-base': size === 'sm',
            'px-6 py-3 text-lg': size === 'md',
            'px-8 py-4 text-xl': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
