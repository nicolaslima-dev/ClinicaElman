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
    <div className="action-card relative group bg-white p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-semibold font-heading text-ink-900 mt-1">
          {value} <span className={`text-sm font-medium font-sans ${subtitleColor}`}>{subtitle}</span>
        </p>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBgColor} ${iconColor}`}>
        <i className={`ph ${icon} text-xl`}></i>
      </div>
      
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-ink-900 text-white text-xs text-center p-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg font-medium">
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
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
        subtitleColor="text-red-500"
        icon="ph-warning-circle"
        iconBgColor="bg-gold-50"
        iconColor="text-gold-600"
        tooltip="Guias que estão pendentes de autorização ou possuem alertas de auditoria."
      />

      {/* Card 4: Relatórios Rápidos (Custom style) */}
      <div 
        onClick={onExportarAgenda}
        className="action-card cursor-pointer p-5 rounded-[16px] border border-ink-100 shadow-card flex items-center justify-between bg-gradient-to-br from-brand-900 to-ink-900 text-white"
      >
        <div>
          <p className="text-xs font-medium text-brand-200 uppercase tracking-wide">Relatórios</p>
          <p className="text-sm font-medium mt-1 leading-snug">Exportar agenda<br/>e listagem diária</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
          <i className="ph ph-download-simple text-xl"></i>
        </div>
      </div>
    </div>
  );
}
