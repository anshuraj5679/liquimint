'use client';

import React, { forwardRef } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'outlined';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  variant?: InputVariant;
  error?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-[0.95rem]',
  lg: 'h-12 px-5 text-base',
};

const variantStyles: Record<InputVariant, string> = {
  default: 'border border-dark-border-primary bg-[linear-gradient(140deg,rgba(255,255,255,0.96),rgba(242,246,253,0.96))] focus:border-primary-300',
  filled: 'border border-transparent bg-dark-bg-elevated/95 focus:border-primary-300',
  outlined: 'border border-dark-border-primary bg-transparent focus:border-primary-300',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      error,
      label,
      leftIcon,
      rightIcon,
      rightElement,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.08em] text-neutral-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-xl
              text-slate-900 placeholder-neutral-500/90
              transition-all duration-200 ease-out
              focus:outline-none focus:ring-2 focus:ring-primary-400/55
              disabled:opacity-50 disabled:cursor-not-allowed
              ${sizeStyles[size]}
              ${variantStyles[variant]}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || rightElement ? 'pr-10' : ''}
              ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/50' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
          {rightElement && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-error-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
