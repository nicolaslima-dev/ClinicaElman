import React from 'react';

export type KpiColorScheme = 'emerald' | 'brand' | 'red' | 'gold';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string; // ex: 'text-slate-400', 'text-red-500'
  icon: string; // ex: 'ph-wallet'
  colorScheme: KpiColorScheme;
  badgeText?: string;
  badgeIcon?: string; // ex: 'ph-trend-up'
  progressPercentage?: number; // Se existir, exibe uma barra de progresso no lugar do subtitle
  animationDelay?: string; // ex: '0ms', '100ms'
}

const colorMaps: Record<KpiColorScheme, { bg: string; icon: string; badgeText: string; progress: string }> = {
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    badgeText: 'text-emerald-700',
    progress: 'bg-emerald-500',
  },
  brand: {
    bg: 'bg-brand-50',
    icon: 'text-brand-600',
    badgeText: 'text-brand-700',
    progress: 'bg-brand-500',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    badgeText: 'text-red-700',
    progress: 'bg-red-500',
  },
  gold: {
    bg: 'bg-gold-50', // pode precisar ser adicionado no tailwind se não existir, mas brand fallback ok
    icon: 'text-gold-600',
    badgeText: 'text-gold-700',
    progress: 'bg-gold-500',
  }
};

export function KpiCard({
  title,
  value,
  subtitle,
  subtitleColor = 'text-slate-400',
  icon,
  colorScheme,
  badgeText,
  badgeIcon,
  progressPercentage,
  animationDelay = '0ms',
}: KpiCardProps) {
  const colors = colorMaps[colorScheme] || colorMaps.brand;

  return (
    <div 
      className="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex flex-col justify-between hover:shadow-premium-hover transition-shadow duration-300" 
      style={{ animationDelay }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center shrink-0`}>
          <i className={`ph ${icon} text-2xl ${colors.icon}`}></i>
        </div>
        
        {badgeText && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.badgeText}`}>
            {badgeIcon && <i className={`ph ${badgeIcon}`}></i>}
            {badgeText}
          </span>
        )}
      </div>
      
      <div>
        <h4 className="text-sm font-semibold text-slate-500 mb-1">{title}</h4>
        <p className="text-3xl font-bold font-heading text-slate-900 transition-all duration-500">{value}</p>
        
        {progressPercentage !== undefined ? (
          <div className="mt-2.5 relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full ${colors.progress} rounded-full transition-all duration-500`} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        ) : (
          subtitle && (
            <p className={`text-xs ${subtitleColor} mt-1 font-medium`}>
              {subtitle}
            </p>
          )
        )}
      </div>
    </div>
  );
}
