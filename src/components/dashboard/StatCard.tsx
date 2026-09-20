'use client';

import React from 'react';
import { Clock, AlertCircle, CheckCircle2, FileWarning } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export type StatIconType = 'pending' | 'overdue' | 'paid' | 'count';

interface StatCardProps {
  label: string;
  value: string;
  iconType: StatIconType;
  variant: 'default' | 'amber' | 'rose' | 'emerald';
}

const variantStyles = {
  default: {
    iconBg: 'bg-white/5 border-white/10 text-white/70',
    valueText: 'text-white',
  },
  amber: {
    iconBg: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    valueText: 'text-amber-300',
  },
  rose: {
    iconBg: 'bg-rose-500/10 border-rose-500/25 text-rose-400',
    valueText: 'text-rose-400',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
    valueText: 'text-emerald-300',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  iconType,
  variant = 'default',
}) => {
  const styles = variantStyles[variant];

  const renderIcon = () => {
    switch (iconType) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'paid':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'count':
        return <FileWarning className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <GlassCard className="p-5 sm:p-6 border-white/15 bg-slate-900/60 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50 truncate">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${styles.iconBg}`}
        >
          {renderIcon()}
        </div>
      </div>
      <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${styles.valueText}`}>
        {value}
      </div>
    </GlassCard>
  );
};

export default StatCard;
