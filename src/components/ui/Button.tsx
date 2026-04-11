import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center font-bold transition-all duration-200 rounded-full shadow-[0_2px_16px_0_rgba(198,255,0,0.10)]',
          'focus:outline-none focus:ring-2 focus:ring-premium-limao focus:ring-offset-2 focus:ring-offset-premium-black',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-premium-limao text-premium-black hover:bg-premium-limaoLight hover:shadow-[0_0_32px_0_rgba(198,255,0,0.25)]': variant === 'primary',
            'bg-premium-gray text-white hover:bg-premium-darkGray': variant === 'secondary',
            'border-2 border-primary text-primary hover:bg-primary hover:text-white': variant === 'outline',
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
