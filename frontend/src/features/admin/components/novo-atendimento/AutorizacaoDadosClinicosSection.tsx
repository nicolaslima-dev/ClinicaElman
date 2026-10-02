import React from 'react';

interface AutorizacaoDadosClinicosSectionProps {
  isSadt: boolean;
}

export function AutorizacaoDadosClinicosSection({ isSadt }: AutorizacaoDadosClinicosSectionProps) {
  return (
    <div className="bg-white p-7 rounded-[20px] shadow-card">
      <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-ink-100/60">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          <i className="ph ph-file-text text-lg"></i>
        </div>
        <h3 className="text-base font-semibold font-heading text-ink-900">Autorização e Dados Clínicos</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Data Solicitação Guia</label>
            <input type="date" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-07-01" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Data Autorização Senha</label>
            <input type="date" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-07-01" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Validade da Senha</label>
            <input type="date" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-09-15" />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Nº Guia Operadora</label>
          <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 font-mono" placeholder="Guia gerada pelo convênio" />
        </div>
        <div className="col-span-1 md:col-span-1">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Nº Guia Prestador</label>
          <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 font-mono" placeholder="Guia do prestador" defaultValue="38291040" />
        </div>
        <div className="col-span-1 md:col-span-1">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Senha / Token <span className={isSadt ? "text-red-500" : "hidden"}>*</span></label>
          <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-brand-700 font-mono font-medium" placeholder="Código liberado" defaultValue="X88A-92P" />
        </div>

        <div className="col-span-1 md:col-span-4">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Diagnóstico (CID-10 Principal) <span className={isSadt ? "text-red-500" : "hidden"}>*</span></label>
          <div className="relative">
            <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 font-medium" placeholder="Buscar por código ou descrição..." defaultValue="M54.5 - Dor lombar baixa" />
          </div>
        </div>
      </div>
    </div>
  );
}
