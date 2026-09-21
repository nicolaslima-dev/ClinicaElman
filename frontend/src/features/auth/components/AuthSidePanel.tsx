import { type ReactNode, useState } from 'react';
import { Target } from 'lucide-react';
import logoElman from '../../../assets/images/logos/logo-elman.png';
import { NodaLogo } from '../../../components/NodaLogo';

export interface AuthSidePanelHighlight {
  icon: ReactNode;
  iconBgClass: string;
  iconTextClass: string;
  iconBorderClass: string;
  title: string;
  description: string;
}

export interface AuthSidePanelProps {
  badgeText?: string;
  title: string;
  description: string;
  highlights: AuthSidePanelHighlight[];
  minimalistCards?: boolean;
}

export function AuthSidePanel({ badgeText, title, description, highlights, minimalistCards }: AuthSidePanelProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <aside className="w-full lg:w-5/12 xl:w-5/12 glass-side-panel relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 text-white overflow-hidden shrink-0">
      {/* Subtle background lighting spots */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-40"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/15 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl pointer-events-none"></div>

      {/* Top Header & Brand Identity */}
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-10">
          {!imageError ? (
            <img
              src={logoElman}
              alt="Clínica Elman"
              className="h-12 w-auto max-w-[220px] object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-2xl sm:text-3xl font-semibold font-heading tracking-tight text-white flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-brand-800/80 border border-brand-400/30 flex items-center justify-center text-brand-200 shadow-inner">
                <Target className="text-2xl" />
              </span>
              CLÍNICA <span className="text-brand-200 font-light">elman</span>
            </div>
          )}
        </div>

        <div className="gold-accent-bar mb-6"></div>

        {badgeText && (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-brand-900/80 text-brand-200 border border-brand-700/50 mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-gold-400"></span>
            {badgeText}
          </span>
        )}

        <h1 className="text-3xl sm:text-4xl xl:text-[42px] font-heading font-semibold text-white tracking-tight leading-tight">
          {title}
        </h1>

        <p className="text-sm sm:text-base text-brand-100/70 mt-4 max-w-md leading-relaxed">
          {description}
        </p>
      </div>

      {/* Center Highlights */}
      <div className="relative z-10 my-10 space-y-4">
        {highlights.map((item, index) => (
          <div key={index} className={`flex items-start gap-4 max-w-md ${minimalistCards ? 'py-2' : 'p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm'}`}>
            <div className={`h-10 w-10 ${minimalistCards ? 'rounded-full' : 'rounded-xl'} ${item.iconBgClass} ${item.iconBorderClass} flex items-center justify-center ${item.iconTextClass} shrink-0`}>
              {item.icon}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white font-heading tracking-wide">{item.title}</h2>
              <p className="text-xs text-brand-100/65 mt-0.5 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Status Indicator */}
      <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col items-center justify-center gap-2 text-center w-full">
        <span className="text-[10px] font-semibold text-brand-200/50 uppercase tracking-widest">POWERED BY</span>
        <NodaLogo iconSize={28} textSize="text-xl text-white" />
      </div>
    </aside>
  );
}
