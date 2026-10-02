import React from 'react';

interface TipoGuiaSectionProps {
  tipoGuia: 'GUIA_CONSULTA' | 'GUIA_SP_SADT';
  setTipoGuia: (tipo: 'GUIA_CONSULTA' | 'GUIA_SP_SADT') => void;
}

export function TipoGuiaSection({ tipoGuia, setTipoGuia }: TipoGuiaSectionProps) {
  return (
    <div className="bg-white p-6 rounded-[20px] shadow-card">
      <div className="flex flex-wrap items-center gap-4">
        <h3 className="text-base font-semibold font-heading text-ink-900 w-32">Tipo de Guia:</h3>
        <div className="segmented-control flex p-1 bg-ink-50 rounded-lg border border-ink-100 flex-1 max-w-sm">
          <input type="radio" id="guia_consulta" name="tipo_guia" value="GUIA_CONSULTA" checked={tipoGuia === 'GUIA_CONSULTA'} onChange={(e) => setTipoGuia(e.target.value as any)} className="hidden" />
          <label htmlFor="guia_consulta" className={`flex-1 text-center p-2 text-[13px] font-medium rounded-md cursor-pointer transition-colors ${tipoGuia === 'GUIA_CONSULTA' ? 'bg-white text-brand-600 shadow-sm border border-ink-100' : 'text-ink-500 hover:text-ink-700 border border-transparent'}`}>Consulta</label>

          <input type="radio" id="guia_sadt" name="tipo_guia" value="GUIA_SP_SADT" checked={tipoGuia === 'GUIA_SP_SADT'} onChange={(e) => setTipoGuia(e.target.value as any)} className="hidden" />
          <label htmlFor="guia_sadt" className={`flex-1 text-center p-2 text-[13px] font-medium rounded-md cursor-pointer transition-colors ${tipoGuia === 'GUIA_SP_SADT' ? 'bg-white text-brand-600 shadow-sm border border-ink-100' : 'text-ink-500 hover:text-ink-700 border border-transparent'}`}>SP / SADT</label>
        </div>
      </div>
    </div>
  );
}
