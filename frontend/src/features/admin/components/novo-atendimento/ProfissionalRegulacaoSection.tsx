import React from 'react';

interface ProfissionalRegulacaoSectionProps {
  isSadt: boolean;
}

export function ProfissionalRegulacaoSection({ isSadt }: ProfissionalRegulacaoSectionProps) {
  return (
    <div className="bg-white p-7 rounded-[20px] shadow-card">
      <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-ink-100/60">
        <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-600">
          <i className="ph ph-stethoscope text-lg"></i>
        </div>
        <h3 className="text-base font-semibold font-heading text-ink-900">Profissional e Regulação</h3>
      </div>

      <div className="mb-3">
        <h4 className="text-sm font-medium text-ink-700 mb-3">Profissional Executante</h4>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Nome do Profissional</label>
            <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="Dr. Carlos Mendes" />
          </div>
          <div className="col-span-1 md:col-span-1">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Cód. Operadora</label>
            <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="489" />
          </div>
          <div className="col-span-1 md:col-span-1">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Conselho</label>
            <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
              <option value="CRM" selected>CRM</option>
              <option value="CREFITO">CREFITO</option>
            </select>
          </div>
          <div className="col-span-1 md:col-span-1">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Número</label>
            <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="44556" />
          </div>
          <div className="col-span-1 md:col-span-1">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">UF</label>
            <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
              <option value="RJ" selected>RJ</option>
              <option value="SP">SP</option>
            </select>
          </div>
          <div className="col-span-1 md:col-span-6">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">CBO (Classificação Brasileira de Ocupações)</label>
            <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
              <option value="225125" selected>225125 - Médico Clínico</option>
            </select>
          </div>
        </div>
      </div>

      {isSadt && (
        <div className="mt-6 pt-5 border-t border-ink-100">
          <h4 className="text-sm font-medium text-ink-700 mb-3">Profissional Solicitante (Para SP/SADT)</h4>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Nome do Profissional <span className="text-red-500">*</span></label>
              <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Conselho <span className="text-red-500">*</span></label>
              <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                <option value="CRM">CRM</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">Número</label>
              <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-ink-500 mb-1.5">CBO <span className="text-red-500">*</span></label>
              <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
                <option value="225125">225125 - Médico Clínico</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
