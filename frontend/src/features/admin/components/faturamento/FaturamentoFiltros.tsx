import React from 'react';

interface FaturamentoFiltrosProps {
  convenio: string;
  setConvenio: (val: string) => void;
}

export function FaturamentoFiltros({ convenio, setConvenio }: FaturamentoFiltrosProps) {
  const formLabelClass = "block text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide";
  const formInputClass = "w-full bg-ink-50 border border-ink-100 rounded-[10px] py-2.5 px-3.5 text-sm text-ink-700 transition-all outline-none focus:bg-white focus:border-brand-300 focus:ring-[3px] focus:ring-brand-600/10";

  return (
    <div id="filtros-block" className="bg-white p-7 rounded-[20px] shadow-card mb-6 print:hidden">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-5">
          <div>
            <label className={formLabelClass}>Período de Atendimento</label>
            <div className="flex items-center gap-3">
              <input type="date" defaultValue="2026-06-01" className={formInputClass} />
              <span className="text-ink-400 text-sm">até</span>
              <input type="date" defaultValue="2026-08-06" className={formInputClass} />
            </div>
          </div>
          <div>
            <label className={formLabelClass}>Versão TISS (Exportação)</label>
            <select className={`${formInputClass} appearance-none bg-brand-50/50 text-brand-700 font-medium border-brand-200`}>
              <option value="4.03.00">Padrão Orizon - Versão 4.03.00 (Recomendado)</option>
              <option value="4.02.00">Versão 4.02.00</option>
            </select>
          </div>
        </div>

        <div className="flex-1 space-y-5">
          <div>
            <label className={formLabelClass}>Convênios</label>
            <select 
              id="filtroConvenioFaturamento"
              value={convenio} 
              onChange={(e) => setConvenio(e.target.value)}
              className={`${formInputClass} appearance-none`}
            >
              <option value="" disabled>Selecione um Convênio obrigatório...</option>
              <option value="CASSI">CASSI</option>
              <option value="BRADESCO">BRADESCO</option>
              <option value="SULAMERICA">SULAMERICA</option>
              <option value="UNIMED">UNIMED</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={formLabelClass}>Local</label>
              <select className={`${formInputClass} appearance-none`} defaultValue="DOMICILIAR">
                <option value="CLÍNICA">CLÍNICA</option>
                <option value="DOMICILIAR">DOMICILIAR</option>
              </select>
            </div>
            <div>
              <label className={formLabelClass}>Tipo de Guia</label>
              <select className={`${formInputClass} appearance-none`} defaultValue="SP/SADT">
                <option value="SP/SADT">SP/SADT</option>
                <option value="Consulta">Consulta</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
