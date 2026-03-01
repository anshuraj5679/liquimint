'use client';

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'border border-primary-300/60 bg-[linear-gradient(135deg,#3b82f6_0%,#60a5fa_55%,#ff9966_100%)] text-white shadow-[0_12px_28px_rgba(59,130,246,0.26)] hover:-translate-y-0.5 hover:brightness-105',
  secondary:
    'border border-dark-border-primary bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(244,248,255,0.96))] text-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:border-primary-300 hover:bg-dark-bg-hover/90',
  ghost:
    'border border-transparent bg-transparent text-slate-600 hover:border-primary-400/35 hover:bg-primary-500/10 hover:text-slate-900',
  danger:
    'border border-error-400/45 bg-[linear-gradient(135deg,rgba(248,113,113,0.92),rgba(239,68,68,0.96))] text-white shadow-[0_12px_24px_rgba(239,68,68,0.22)] hover:-translate-y-0.5',
  success:
    'border border-success-400/45 bg-[linear-gradient(135deg,rgba(52,211,153,0.95),rgba(16,185,129,0.94))] text-white shadow-[0_12px_24px_rgba(16,185,129,0.22)] hover:-translate-y-0.5',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-[0.93rem]',
  lg: 'h-12 px-8 text-base',
  xl: 'h-14 px-10 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  ...props
}) => {
  const disabled = isDisabled || isLoading;
  const baseClasses = `
    relative inline-flex items-center justify-center gap-2 whitespace-nowrap
    rounded-xl font-semibold tracking-[0.03em]
    transition-all duration-200 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
    focus-visible:ring-2 focus-visible:ring-primary-300/70
    [clip-path:polygon(0_8px,8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px))]
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  const content = (
    <>
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span>{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span>{rightIcon}</span>}
    </>
  );

  return (
    <button
      className={baseClasses}
      disabled={disabled}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
