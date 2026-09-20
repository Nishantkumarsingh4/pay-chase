'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hoverEffect = true,
  ...props
}) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -6, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden transition-colors duration-300 shadow-xl shadow-black/40',
        hoverEffect && 'hover:border-indigo-400/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.2)]',
        className
      )}
      {...props}
    >
      {/* Specular glass reflection line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {/* Subtle corner light */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default GlassCard;
