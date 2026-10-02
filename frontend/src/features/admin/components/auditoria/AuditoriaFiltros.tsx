import React from 'react';

interface AuditoriaFiltrosProps {
  convenio: string;
  setConvenio: (val: string) => void;
  competencia: string;
  setCompetencia: (val: string) => void;
}

export function AuditoriaFiltros({
  convenio,
  setConvenio,
  competencia,
  setCompetencia
}: AuditoriaFiltrosProps) {
  const formInputClass = "w-full h-11 border border-slate-200 bg-slate-50 rounded-xl px-3.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 transition-shadow";

  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex-1">
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Convênio</label>
        <select id="filtroAuditoriaConvenio" className={formInputClass} value={convenio} onChange={(e) => setConvenio(e.target.value)}>
          <option value="">Todos os Convênios</option>
          <option value="CASSI">CASSI</option>
          <option value="BRADESCO">BRADESCO</option>
          <option value="SULAMERICA">SULAMERICA</option>
          <option value="UNIMED">UNIMED</option>
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Competência (Mês/Ano)</label>
        <input type="month" id="filtroAuditoriaMes" className={formInputClass} value={competencia} onChange={(e) => setCompetencia(e.target.value)} />
      </div>
    </div>
  );
}
