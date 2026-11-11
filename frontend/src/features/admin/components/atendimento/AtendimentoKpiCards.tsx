import React from 'react';

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  subtitle: string;
  subtitleColor?: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  tooltip?: string;
}

function KpiCard({
  title,
  value,
  subtitle,
  subtitleColor = "text-ink-400",
  icon,
  iconBgColor,
  iconColor,
  tooltip
}: KpiCardProps) {
  return (
    <div className="action-card relative group bg-white p-3 sm:p-4 rounded-[16px] sm:rounded-2xl border border-ink-100 shadow-card flex flex-col justify-between gap-2.5">
      <div className="flex items-start justify-between gap-1.5">
        <p className="text-[10px] sm:text-xs font-bold text-ink-500 uppercase tracking-wider leading-tight">
          {title}
        </p>
        <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${iconBgColor} ${iconColor}`}>
          <i className={`ph ${icon} text-xs sm:text-base`}></i>
        </div>
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-bold font-heading text-ink-900 leading-none">
          {value}
        </p>
        <p className={`text-[10px] sm:text-xs font-medium font-sans ${subtitleColor} mt-1 leading-tight`}>
          {subtitle}
        </p>
      </div>
      
      {tooltip && (
        <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-ink-900 text-white text-xs text-center p-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg font-medium">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-ink-900"></div>
        </div>
      )}
    </div>
  );
}

interface AtendimentoKpiCardsProps {
  onExportarAgenda: () => void;
}

export function AtendimentoKpiCards({ onExportarAgenda }: AtendimentoKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-8">
      <KpiCard 
        title="Para Hoje"
        value="42"
        subtitle="pacientes"
        icon="ph-calendar-check"
        iconBgColor="bg-brand-50"
        iconColor="text-brand-600"
        tooltip="Total de pacientes com agendamento confirmado para o dia de hoje."
      />

      <KpiCard 
        title="Em Consultório"
        value="3"
        subtitle="agora"
        icon="ph-stethoscope"
        iconBgColor="bg-blue-50"
        iconColor="text-blue-600"
        tooltip="Pacientes que estão em atendimento médico neste exato momento."
      />

      <KpiCard 
        title="Sem Autorização"
        value="5"
        subtitle="alertas"
        subtitleColor="text-red-500 font-semibold"
        icon="ph-warning-circle"
        iconBgColor="bg-amber-50"
        iconColor="text-amber-600"
        tooltip="Guias que estão pendentes de autorização ou possuem alertas de auditoria."
      />

      {/* Card 4: Relatórios Rápidos (Custom style) */}
      <div 
        onClick={onExportarAgenda}
        className="action-card cursor-pointer p-3 sm:p-4 rounded-[16px] sm:rounded-2xl border border-ink-100 shadow-card flex flex-col justify-between gap-2.5 bg-gradient-to-br from-brand-900 to-ink-900 text-white"
      >
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-[10px] sm:text-xs font-bold text-brand-200 uppercase tracking-wider leading-tight">
            Relatórios
          </p>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/20 shrink-0">
            <i className="ph ph-download-simple text-xs sm:text-base"></i>
          </div>
        </div>
        <div>
          <p className="text-sm sm:text-base font-bold leading-tight">
            Exportar agenda
          </p>
          <p className="text-[10px] sm:text-xs text-brand-100/80 mt-1 leading-tight">
            Listagem diária
          </p>
        </div>
      </div>
    </div>
  );
}
