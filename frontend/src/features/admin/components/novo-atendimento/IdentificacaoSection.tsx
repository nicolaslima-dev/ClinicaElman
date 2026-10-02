import React from 'react';

export function IdentificacaoSection() {
  return (
    <div className="bg-white p-7 rounded-[20px] shadow-card">
      <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-ink-100/60">
        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
          <i className="ph ph-user text-lg"></i>
        </div>
        <h3 className="text-base font-semibold font-heading text-ink-900">Identificação e Elegibilidade</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="col-span-1 md:col-span-4">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Buscar Paciente (Nome, CPF ou Prontuário)</label>
          <div className="relative">
            <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"></i>
            <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 pl-10 text-sm outline-none focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 transition-all text-ink-900" placeholder="Digite para buscar..." defaultValue="Mariana Costa e Silva (CPF: 123.456.789-00)" />
          </div>
        </div>

        <div className="col-span-1 md:col-span-1">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Operadora / Convênio</label>
          <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
            <option value="">Selecione...</option>
            <option value="bradesco" selected>Bradesco Saúde</option>
            <option value="cassi">CASSI</option>
            <option value="unimed">Unimed</option>
          </select>
        </div>

        <div className="col-span-1 md:col-span-1">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Plano</label>
          <select className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 appearance-none">
            <option value="">Selecione...</option>
            <option value="top">Top Nacional</option>
            <option value="efetivo" selected>Efetivo Prata</option>
          </select>
        </div>

        <div className="col-span-1 md:col-span-1">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Matrícula / Carteirinha</label>
          <input type="text" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900 font-mono" defaultValue="738.992.102345.01" />
        </div>

        <div className="col-span-1 md:col-span-1">
          <label className="block text-xs font-medium text-ink-500 mb-1.5">Validade da Carteira</label>
          <input type="month" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2027-12" />
        </div>
      </div>
    </div>
  );
}
