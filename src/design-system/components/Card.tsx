'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bevel-panel',
  elevated: 'bevel-panel shadow-[0_20px_40px_rgba(15,23,42,0.08)]',
  outlined:
    'rounded-3xl border border-primary-300/45 bg-[linear-gradient(150deg,rgba(255,255,255,0.94),rgba(241,245,252,0.92))] backdrop-blur-2xl',
  glass:
    'rounded-3xl border border-white/70 bg-[linear-gradient(140deg,rgba(255,255,255,0.8),rgba(246,249,255,0.74))] backdrop-blur-2xl',
};

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-7 md:p-8',
  xl: 'p-8 md:p-10',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hover = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      className={`
        relative overflow-hidden transition-all duration-300
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hover ? 'cursor-pointer hover:-translate-y-1 hover:border-primary-300/55 hover:shadow-[0_18px_34px_rgba(37,99,235,0.16)]' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4 } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
