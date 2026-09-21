import { Target, ShieldCheck, Unlock } from 'lucide-react';
import { useState } from 'react';
import logoElman from '../../../assets/images/logos/logo-elman.png';
import { NodaLogo } from '../../../components/NodaLogo';

export function InstitutionalSidePanel() {
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


        <h1 className="text-3xl sm:text-4xl xl:text-[42px] font-heading font-semibold text-white tracking-tight leading-tight">
          Gestão Médica e Auditoria Integrada
        </h1>

        <p className="text-sm sm:text-base text-brand-100/70 mt-4 max-w-md leading-relaxed">
          Plataforma clínica executiva dedicada ao monitoramento de faturamento TISS, conciliação de glosas e repasses médicos.
        </p>
      </div>

      {/* Center Highlights */}
      <div className="relative z-10 my-10 space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm max-w-md">
          <div className="h-10 w-10 rounded-xl bg-brand-700/40 border border-brand-400/30 flex items-center justify-center text-brand-200 shrink-0">
            <ShieldCheck className="text-2xl" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white font-heading tracking-wide">Padrão TISS v4.01 e ANS</h2>
            <p className="text-xs text-brand-100/65 mt-0.5 leading-relaxed">
              Regras de validação automatizada de guias, lotes e demonstrativos de retorno.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm max-w-md">
          <div className="h-10 w-10 rounded-xl bg-gold-500/15 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
            <Unlock className="text-2xl" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white font-heading tracking-wide">Segurança em Nível Hospitalar</h2>
            <p className="text-xs text-brand-100/65 mt-0.5 leading-relaxed">
              Acesso criptografado de ponta a ponta e rastreabilidade total conforme a LGPD.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Status Indicator */}
      <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col items-center justify-center gap-2 text-center w-full">
        <span className="text-[10px] font-semibold text-brand-200/50 uppercase tracking-widest">POWERED BY</span>
        <NodaLogo iconSize={28} textSize="text-xl text-white" />
      </div>
    </aside>
  );
}
