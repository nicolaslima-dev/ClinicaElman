import React from 'react';

interface TratamentoContinuadoSectionProps {
  isSadt: boolean;
  isSessaoSeriada: boolean;
  setIsSessaoSeriada: (val: boolean) => void;
}

export function TratamentoContinuadoSection({ isSadt, isSessaoSeriada, setIsSessaoSeriada }: TratamentoContinuadoSectionProps) {
  if (!isSadt) return null;

  return (
    <div className="bg-white p-7 rounded-[20px] shadow-card">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink-100/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <i className="ph ph-calendar-plus text-lg"></i>
          </div>
          <h3 className="text-base font-semibold font-heading text-ink-900">Tratamento Continuado (Sessões)</h3>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isSessaoSeriada} onChange={(e) => setIsSessaoSeriada(e.target.checked)} className="w-4 h-4 text-brand-600 rounded border-ink-300 focus:ring-brand-500" />
          <span className="text-sm font-medium text-ink-700">Ativar Controle de Sessões</span>
        </label>
      </div>
      {isSessaoSeriada && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <div className="col-span-1">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Sessões Autorizadas</label>
            <input type="number" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="55" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Freq. Semanal</label>
            <input type="number" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="5" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Início Tratamento</label>
            <input type="date" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-05-29" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Fim Tratamento</label>
            <input type="date" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-ink-900" defaultValue="2026-08-26" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Nº Sessão Atual</label>
            <input type="number" className="w-full bg-ink-50 border border-ink-100 rounded-lg p-2.5 text-sm outline-none focus:bg-white focus:border-brand-300 text-brand-700 font-medium" defaultValue="1" />
          </div>
        </div>
      )}
    </div>
  );
}
